import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import axios from "axios";
import { extractFacebookVideoId } from "../../lib/facebook-url-parser";

// 1. اینترفیس‌های استاندارد ورودی و خروجی پروژه
interface VideoQuality {
  quality: "360p" | "480p" | "720p";
  url: string;
}

interface VideoMetadata {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  qualities: VideoQuality[];
  mediaType: string;
  sourceUrl: string;
}

interface NativeScrapeResult {
  sdUrl: string;
  hdUrl: string;
  thumbnail: string;
}

// 2. تنظیمات و ابزارهای کمکی
const MOBILE_USER_AGENT = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";

function isValidFacebookUrl(url: string): boolean {
  return /facebook\.com|fb\.watch|fb\.com/.test(url);
}

const decodeFBUrl = (rawUrl: string): string => {
  try {
    return rawUrl.replace(/\\u0025/g, "%").replace(/\\/g, "").replace(/&amp;/g, "&");
  } catch { return rawUrl; }
};

/**
 * 🔍 آدرس‌یاب هوشمند ضد‌بلوک (تبدیل لینک‌های کوتاه به آدرس واقعی ویدیو یا ریلز)
 */
async function resolveUrl(url: string): Promise<string> {
  if (!url.includes("share") && !url.includes("fb.watch")) return url;
  
  // تبدیل لینک دسکتاپ به نسخه mbasic برای فریب دادن فایروال فیسبوک
  let targetMbasicUrl = url
    .replace("www.facebook.com", "mbasic.facebook.com")
    .replace("m.facebook.com", "mbasic.facebook.com");

  console.log("[Resolver] Expanding link via Mobile Basic Gateway:", targetMbasicUrl);
  
  try {
    const response = await axios.get(targetMbasicUrl, {
      headers: { 
        "User-Agent": MOBILE_USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      },
      maxRedirects: 5,
      timeout: 9000,
      validateStatus: (status) => status >= 200 && status < 400 // جلوگیری از کرش در ریدایرکت‌های خاص
    });

    // گام اول: بررسی ریدایرکت اتوماتیک لایه شبکه
    if (response.request?.res?.responseUrl) {
      const finalUrl = response.request.res.responseUrl;
      if (finalUrl.includes("/reel/") || finalUrl.includes("/videos/") || finalUrl.includes("v=")) {
        console.log("[Resolver] Successfully expanded via Network to:", finalUrl);
        return finalUrl.replace("mbasic.facebook.com", "www.facebook.com");
      }
    }

    // گام دوم: اگر ریدایرکت نشد، شکار آدرس از بدنه HTML (تگ طلایی og:url)
    const html = response.data;
    if (typeof html === "string") {
      const ogUrlMatch = html.match(/property="og:url"\s+content="([^"]+)"/) || html.match(/"target_url":"([^"]+)"/);
      if (ogUrlMatch && ogUrlMatch[1]) {
        const decoded = decodeFBUrl(ogUrlMatch[1]);
        console.log("[Resolver] Successfully expanded via Meta HTML to:", decoded);
        return decoded;
      }
    }
  } catch (e) {
    console.warn("[Resolver] Mobile Basic failed, executing raw header location hunter...");
    try {
      // گام آخر: شکارچی خام هدر Location با متد صفر-انتقال
      const rawRes = await axios.get(url, {
        headers: { "User-Agent": MOBILE_USER_AGENT },
        maxRedirects: 0,
        validateStatus: (status) => status >= 300 && status < 400,
        timeout: 5000
      });
      if (rawRes.headers.location) {
        let loc = rawRes.headers.location;
        if (loc.startsWith("/")) loc = `https://www.facebook.com${loc}`;
        return loc;
      }
    } catch (err) {
      console.error("[Resolver] All expansion strategies exhausted.");
    }
  }
  return url;
}

/**
 * 🛠 استخراج‌کننده همه‌جانبه لینک‌های مستقیم مدیا از سورس صفحات
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
    /meta property="og:image" content="([^"]+)"/,
    /"preferred_thumbnail":{"image":{"uri":"([^"]+)"/
  ];

  let hdUrl = "";
  let sdUrl = "";
  let thumbnail = "";

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

  // اسکنر اضطراری شبکه CDN فیسبوک (FBCDN)
  if (!sdUrl && !hdUrl) {
    const fbcdnRegex = /(https?[:\\\/]+[^\s"'`<>]+?fbcdn\.net[^\s"'`<>]+?)(?=\\"|"|'|&quot;|\s|$)/gi;
    const allMatches = html.match(fbcdnRegex) || [];
    for (const rawMatch of allMatches) {
      const decoded = decodeFBUrl(rawMatch);
      if (decoded.includes("/v/") || decoded.includes(".mp4") || decoded.includes("cat=")) {
        if (!sdUrl) sdUrl = decoded;
        else if (!hdUrl && decoded !== sdUrl) { hdUrl = decoded; break; }
      }
    }
  }

  if (!sdUrl && !hdUrl) return null;

  return { 
    hdUrl: hdUrl || sdUrl, 
    sdUrl: sdUrl || hdUrl, 
    thumbnail 
  };
}

/**
 * 🚀 موتور اصلی اسکرپر دو کاناله فیسبوک
 */
async function scrapeFacebookVideo(url: string): Promise<NativeScrapeResult> {
  const finalUrl = await resolveUrl(url);

  // موتور اول: پلاگین امبد دسکتاپ (بسیار پایدار برای ویدیوهای پابلیک)
  try {
    const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(finalUrl)}`;
    console.log("[Scraper] Running Engine 1 (Embed):", embedUrl);
    const res = await axios.get(embedUrl, { headers: { "User-Agent": MOBILE_USER_AGENT }, timeout: 10000 });
    const data = extractDataFromHtml(res.data);
    if (data) return data;
  } catch (e) { console.log("[Scraper] Engine 1 failed."); }

  // موتور دوم: اسکن لایه موبایل گیت‌وی (`m.facebook.com`)
  try {
    const mobileUrl = finalUrl.replace("www.facebook.com", "m.facebook.com");
    console.log("[Scraper] Running Engine 2 (Mobile Gateway):", mobileUrl);
    const res = await axios.get(mobileUrl, { headers: { "User-Agent": MOBILE_USER_AGENT }, timeout: 10000 });
    const data = extractDataFromHtml(res.data);
    if (data) return data;
  } catch (e) { console.log("[Scraper] Engine 2 failed."); }

  throw new Error("Unable to extract video streams. Facebook security rejected the query.");
}

// 3. سرویس‌های اصلی روتر tRPC پروژه شما
export const facebookDownloaderRouter = router({
  extractVideo: publicProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input }) => {
      try {
        if (!isValidFacebookUrl(input.url)) {
          return { success: false, error: "Invalid Facebook URL." };
        }
        
        const scrapeResult = await scrapeFacebookVideo(input.url);
        const videoId = extractFacebookVideoId(input.url) || "unknown";
        
        return {
          success: true,
          data: {
            id: videoId,
            title: input.url.includes("reel") ? "Facebook Reel" : "Facebook Video",
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
        return { success: false, error: "Facebook security actively rejected the stream request. Please try another video link." };
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
            title: "Facebook Media"
          } 
        };
      } catch (error) {
        return { success: false, error: "Error getting download link from backend streams." };
      }
    }),
});