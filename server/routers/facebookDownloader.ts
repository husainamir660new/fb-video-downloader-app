import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import axios from "axios";
import { extractFacebookVideoId } from "../../lib/facebook-url-parser";

// 1. Interfaces
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

// 2. Constants & Helpers
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function isValidFacebookUrl(url: string): boolean {
  return /facebook\.com|fb\.watch|fb\.com/.test(url);
}

const decodeFBUrl = (rawUrl: string): string => {
  try {
    return rawUrl.replace(/\\u0025/g, "%").replace(/\\/g, "").replace(/&amp;/g, "&");
  } catch { return rawUrl; }
};

/**
 * 🔍 حل‌کننده هوشمند لینک‌های کوتاه فیسبوک
 */
async function resolveUrl(url: string): Promise<string> {
  if (!url.includes("share") && !url.includes("fb.watch")) return url;
  
  try {
    console.log("[Resolver] Expanding link:", url);
    // استفاده از Axios برای دنبال کردن خودکار ریدایرکت‌ها
    const response = await axios.get(url, {
      headers: { "User-Agent": USER_AGENT },
      maxRedirects: 10,
      timeout: 8000
    });

    // اگر ریدایرکت‌ها آدرس نهایی را دادند
    if (response.request?.res?.responseUrl) {
      return response.request.res.responseUrl;
    }

    // اگر ریدایرکت خودکار نشد، بررسی تگ meta og:url
    const ogUrlMatch = response.data.match(/property="og:url"\s+content="([^"]+)"/);
    if (ogUrlMatch && ogUrlMatch[1]) {
      return ogUrlMatch[1];
    }
  } catch (e) {
    console.warn("[Resolver] Could not fully expand, using original.");
  }
  return url;
}

/**
 * 🛠 استخراج‌کننده لینک‌های ویدیو
 */
function extractDataFromHtml(html: string): NativeScrapeResult | null {
  const hdMatch = html.match(/"playable_url_quality_hd":"([^"]+)"/);
  const sdMatch = html.match(/"playable_url":"([^"]+)"/);
  const thumbMatch = html.match(/"thumbnailUrl":"([^"]+)"/);

  const hdUrl = hdMatch ? decodeFBUrl(hdMatch[1]) : "";
  const sdUrl = sdMatch ? decodeFBUrl(sdMatch[1]) : "";
  const thumbnail = thumbMatch ? decodeFBUrl(thumbMatch[1]) : "";

  if (!sdUrl && !hdUrl) return null;

  return { 
    hdUrl: hdUrl || sdUrl, 
    sdUrl: sdUrl || hdUrl, 
    thumbnail 
  };
}

/**
 * 🚀 اصلی‌ترین تابع اسکرپر
 */
async function scrapeFacebookVideo(url: string): Promise<NativeScrapeResult> {
  const finalUrl = await resolveUrl(url);

  // موتور اول: Embed Portal
  try {
    const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(finalUrl)}`;
    const res = await axios.get(embedUrl, { headers: { "User-Agent": USER_AGENT }, timeout: 10000 });
    const data = extractDataFromHtml(res.data);
    if (data) return data;
  } catch (e) { console.log("Engine 1 failed"); }

  // موتور دوم: Mobile Gateway
  try {
    const mobileUrl = finalUrl.replace("www.facebook.com", "m.facebook.com");
    const res = await axios.get(mobileUrl, { headers: { "User-Agent": USER_AGENT }, timeout: 10000 });
    const data = extractDataFromHtml(res.data);
    if (data) return data;
  } catch (e) { console.log("Engine 2 failed"); }

  throw new Error("Unable to extract video. Facebook security restricted the request.");
}

// 3. Router
export const facebookDownloaderRouter = router({
  extractVideo: publicProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input }) => {
      try {
        const scrapeResult = await scrapeFacebookVideo(input.url);
        const videoId = extractFacebookVideoId(input.url) || "unknown";
        
        return {
          success: true,
          data: {
            id: videoId,
            title: "Facebook Video",
            thumbnail: scrapeResult.thumbnail,
            duration: 0,
            qualities: [
              { quality: "720p", url: scrapeResult.hdUrl },
              { quality: "480p", url: scrapeResult.sdUrl },
              { quality: "360p", url: scrapeResult.sdUrl },
            ],
            mediaType: "video",
            sourceUrl: input.url
          }
        };
      } catch (error) {
        return { success: false, error: "Failed to fetch video. Please try again." };
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
            quality: input.quality 
          } 
        };
      } catch (error) {
        return { success: false, error: "Error getting download link." };
      }
    }),
});