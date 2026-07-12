import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import axios from "axios";
import { extractFacebookVideoId } from "../../lib/facebook-url-parser";

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
      .replace(/\\\//g, "/")
      .replace(/\\/g, "")
      .replace(/&amp;/g, "&");
  } catch { return rawUrl; }
};

/**
 * ⚡️ موتور هوشمند سرور برای تبدیل لینک‌های کوتاه فیسبوک به لینک کامل و استاندارد دسکتاپ
 */
async function resolveToCanonicalUrl(url: string): Promise<string> {
  let currentUrl = url.trim();
  if (!/^https?:\/\//i.test(currentUrl)) {
    currentUrl = "https://" + currentUrl;
  }

  // اگر لینک از قبل کامل است، نیازی به پردازش اولیه نیست
  if ((currentUrl.includes("/videos/") || currentUrl.includes("/watch") || currentUrl.includes("/reel/")) && !currentUrl.includes("share") && !currentUrl.includes("fb.watch")) {
    return currentUrl;
  }

  console.log("[Backend Resolver] Resolving short/share URL on server:", currentUrl);
  try {
    const res = await axios.get(currentUrl, {
      headers: { 
        "User-Agent": DESKTOP_USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
      },
      timeout: 8000,
      maxRedirects: 5
    });

    // ۱. بررسی ریدایرکت خودکار اکسپند شده توسط لایه HTTP
    const redirectedUrl = res.request?.res?.responseUrl || res.config?.url;
    if (redirectedUrl && (redirectedUrl.includes("/videos/") || redirectedUrl.includes("/watch/") || redirectedUrl.includes("/reel/")) && !redirectedUrl.includes("/login")) {
      console.log("[Backend Resolver] Resolved via HTTP Redirect:", redirectedUrl);
      return redirectedUrl;
    }

    // ۲. بررسی درون سورس HTML برای یافتن متای og:url فیسبوک (بسیار پایدار)
    const html = res.data;
    const ogUrlMatch = html.match(/meta property="og:url" content="([^"]+)"/) || 
                       html.match(/<link rel="canonical" href="([^"]+)"/);
    if (ogUrlMatch && ogUrlMatch[1]) {
      const canonical = decodeFBUrl(ogUrlMatch[1]);
      if (isValidFacebookUrl(canonical) && !canonical.includes("/login")) {
        console.log("[Backend Resolver] Resolved via HTML Meta og:url:", canonical);
        return canonical;
      }
    }
    
    // ۳. اگر به دیوار لاگین برخورد کرد، لینک اصلی را از پارامتر next بیرون می‌کشد
    if (redirectedUrl && redirectedUrl.includes("/login")) {
      const urlObj = new URL(redirectedUrl);
      const nextParam = urlObj.searchParams.get("next");
      if (nextParam) {
        const decodedNext = decodeURIComponent(nextParam);
        console.log("[Backend Resolver] Resolved via Login Wall 'next' parameter:", decodedNext);
        return decodedNext;
      }
    }
  } catch (err) {
    console.error("[Backend Resolver] Error expanding URL on server:", err);
  }

  return currentUrl;
}

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
    if (match && match[1]) { title = match[1].replace("- Video Downloader", "").trim(); break; }
  }

  if (!sdUrl && !hdUrl) return null;

  return { 
    hdUrl: hdUrl || sdUrl, 
    sdUrl: sdUrl || hdUrl, 
    thumbnail,
    title: title || "Facebook Media"
  };
}

async function scrapeFacebookVideo(url: string): Promise<NativeScrapeResult> {
  // تبدیل لینک کوتاه ورودی به لینک کامل و قانونی دسکتاپ پیش از اسکرپ کردن
  const canonicalUrl = await resolveToCanonicalUrl(url);

  // کانال اول: موتور امبد ویدیو دسکتاپ
  try {
    const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(canonicalUrl)}`;
    console.log("[Scraper] Running Engine 1 (Embed):", embedUrl);
    
    const res = await axios.get(embedUrl, { 
      headers: { "User-Agent": DESKTOP_USER_AGENT }, 
      timeout: 10000 
    });
    
    const data = extractDataFromHtml(res.data);
    if (data) return data;
  } catch (e) { 
    console.warn("[Scraper] Engine 1 (Embed) failed, shifting to backup..."); 
  }

  // کانال دوم: موتور موبایل گیت‌وی (پشتیبان اضطراری)
  try {
    const mobileUrl = canonicalUrl.replace("www.facebook.com", "m.facebook.com");
    console.log("[Scraper] Running Engine 2 (Mobile Backup):", mobileUrl);
    
    const res = await axios.get(mobileUrl, { 
      headers: { "User-Agent": MOBILE_USER_AGENT }, 
      timeout: 10000 
    });
    
    const data = extractDataFromHtml(res.data);
    if (data) return data;
  } catch (e) { 
    console.error("[Scraper] Engine 2 (Mobile Backup) failed."); 
  }

  throw new Error("Facebook security rejected the request. Content might be private or restricted.");
}

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
        
        return {
          success: true,
          data: {
            id: videoId,
            title: scrapeResult.title !== "Facebook Media" ? scrapeResult.title : (input.url.includes("reel") ? "Facebook Reel" : "Facebook Video"),
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