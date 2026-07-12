import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import axios from "axios";
import { extractFacebookVideoId } from "../../lib/facebook-url-parser";

// 1. اینترفیس‌های استاندارد پروژه
interface VideoQuality {
  quality: "360p" | "480p" | "720p";
  url: string;
}

interface NativeScrapeResult {
  sdUrl: string;
  hdUrl: string;
  thumbnail: string;
  title: string;
}

// 2. تنظیمات و ابزارهای کمکی کمکی
const DESKTOP_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const MOBILE_USER_AGENT = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";

function isValidFacebookUrl(url: string): boolean {
  return /facebook\.com|fb\.watch|fb\.com/.test(url);
}

const decodeFBUrl = (rawUrl: string): string => {
  try {
    return rawUrl
      .replace(/\\u003a/g, ":")
      .replace(/\\u0025/g, "%")
      .replace(/\\u0026/g, "&")
      .replace(/\\\//g, "/") // اصلاح فاصله اضافی ریجکس
      .replace(/\\/g, "")
      .replace(/&amp;/g, "&");
  } catch { return rawUrl; }
};

/**
 * 🛠 استخراج‌کننده همه‌جانبه مدیا و عنوان واقعی ویدیو از سورس صفحات
 */
function extractDataFromHtml(html: string): NativeScrapeResult | null {
  const hdRegexes = [
    /"playable_url_quality_hd":"([^"]+)"/,
    /(?:playable_url_quality_hd|browser_native_hd_url|hd_src)[^\w]+(https?.*?)(?=\\"|"|'|&quot;)/i
  ];
  
  const sdRegexes = [
    /"playable_url":"([^"]+)"/,
    /(?:playable_url|browser_native_sd_url|sd_src|video_src)[^\w]+(https?.*?)(?=\\"|"|'|&quot;)/i,
    /meta property="og:video" content="([^"]+)"/
  ];

  const thumbRegexes = [
    /"thumbnailUrl":"([^"]+)"/,
    /meta property="og:image" content="([^"]+)"/
  ];

  const titleRegexes = [
    /meta property="og:title" content="([^"]+)"/,
    /<title>([^<]+)<\/title>/
  ];

  let hdUrl = "";
  let sdUrl = "";
  let thumbnail = "";
  let title = "";

  for (const regex of hdRegexes) {
    const match = html.match(regex);
    if (match && match[1]) { hdUrl = decodeFBUrl(match[1]); break; }
  }

  for (const regex of sdRegexes) {
    const match = html.match(regex);
    if (match && match[1]) { sdUrl = decodeFBUrl(match[1]); break; }
  }

  for (const regex of thumbRegexes) {
    const match = html.match(regex);
    if (match && match[1]) { thumbnail = decodeFBUrl(match[1]); break; }
  }

  for (const regex of titleRegexes) {
    const match = html.match(regex);
    if (match && match[1]) { 
      title = match[1].replace("- Video Downloader", "").trim(); 
      break; 
    }
  }

  if (!sdUrl && !hdUrl) return null;

  return { 
    hdUrl: hdUrl || sdUrl, 
    sdUrl: sdUrl || hdUrl, 
    thumbnail,
    title: title || "Facebook Video"
  };
}

/**
 * 🚀 موتور دو کاناله اسکرپر با پایداری حداکثری
 */
async function scrapeFacebookVideo(url: string): Promise<NativeScrapeResult> {
  // کانال اول: موتور امبد دسکتاپ (انتخاب اول و پایدار برای لینک‌های مستقیم)
  try {
    const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
    console.log("[Scraper] Running Engine 1 (Embed):", embedUrl);
    
    const res = await axios.get(embedUrl, { 
      headers: { "User-Agent": DESKTOP_USER_AGENT }, 
      timeout: 10000 
    });
    
    const data = extractDataFromHtml(res.data);
    if (data) return data;
  } catch (e) { 
    console.warn("[Scraper] Engine 1 (Embed) failed, switching to backup engine..."); 
  }

  // کانال دوم: موتور پشتیبان موبایل گیت‌وی (اگر امبد به هر دلیلی رد شد)
  try {
    const mobileUrl = url.replace("www.facebook.com", "m.facebook.com");
    console.log("[Scraper] Running Engine 2 (Mobile Backup):", mobileUrl);
    
    const res = await axios.get(mobileUrl, { 
      headers: { "User-Agent": MOBILE_USER_AGENT }, 
      timeout: 10000 
    });
    
    const data = extractDataFromHtml(res.data);
    if (data) return data;
  } catch (e) { 
    console.error("[Scraper] Engine 2 (Mobile Backup) also failed."); 
  }

  throw new Error("Facebook security restricted the query or the content is completely private.");
}

// 3. سرویس‌های اصلی روتر tRPC بک‌اَند
export const facebookDownloaderRouter = router({
  extractVideo: publicProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input }) => {
      try {
        if (!isValidFacebookUrl(input.url)) {
          return { success: false, error: "Invalid Facebook URL." };
        }
        
        const scrapeResult = await scrapeFacebookVideo(input.url);
        const videoId = extractFacebookVideoId(input.url) || Date.now().toString();
        
        // تعیین عنوان پویا و واقعی استخراج شده
        const displayTitle = scrapeResult.title !== "Facebook Video" 
          ? scrapeResult.title 
          : (input.url.includes("reel") ? "Facebook Reel" : "Facebook Video");

        return {
          success: true,
          data: {
            id: videoId,
            title: displayTitle,
            thumbnail: scrapeResult.thumbnail,
            duration: 0,
            qualities: [
              { quality: "720p", url: scrapeResult.hdUrl },
              { quality: "480p", url: scrapeResult.sdUrl },
              { quality: "360p", url: scrapeResult.sdUrl },
            ],
            mediaType: input.url.includes("reel") ? "reel" : "video",
            sourceUrl: input.url
          }
        };
      } catch (error) {
        return { success: false, error: "Unable to parse this video. Ensure it is public." };
      }
    }),

  getDownloadUrl: publicProcedure
    .input(z.object({ url: z.string().url(), quality: z.enum(["360p", "480p", "720p"]) }))
    .mutation(async ({ input }) => {
      try {
        const scrapeResult = await scrapeFacebookVideo(input.url);
        return { 
          success: true, 
          data: { 
            url: input.quality === "720p" ? scrapeResult.hdUrl : scrapeResult.sdUrl, 
            quality: input.quality,
            title: scrapeResult.title
          } 
        };
      } catch (error) {
        return { success: false, error: "Error getting download link." };
      }
    }),
});