import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import axios, { AxiosError } from "axios";
import { extractFacebookVideoId } from "../../lib/facebook-url-parser";

/**
 * ============================================================================
 * Facebook Video Downloader Router - Hybrid Triple-Engine Scraper with Resolver
 * ============================================================================
 */

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

interface APIErrorResponse {
  success: false;
  error: string;
}

interface APISuccessResponse<T> {
  success: true;
  data: T;
}

interface NativeScrapeResult {
  sdUrl: string;
  hdUrl: string;
  thumbnail: string;
}

const USER_AGENTS = [
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
];

function isValidFacebookUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    return hostname.includes("facebook.com") || hostname.includes("fb.com") || hostname.includes("fb.watch");
  } catch {
    return false;
  }
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response?.data?.message) return error.response.data.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Unknown error occurred";
}

const decodeFBUrl = (rawUrl: string): string => {
  try {
    let clean = rawUrl.replace(/&amp;/g, "&").replace(/\\+$/, "");
    if (clean.includes('\\')) {
      return JSON.parse(`"${clean}"`);
    }
    return clean;
  } catch {
    return rawUrl.replace(/\\\/ /g, "/").replace(/\\/g, "").replace(/&amp;/g, "&");
  }
};

/**
 * 🔍 موتور آنالیز عمیق کدهای متنی برای بیرون کشیدن لینک‌های استریم
 */
function extractUrlsFromHtml(html: string): NativeScrapeResult | null {
  let hdUrl = "";
  let sdUrl = "";
  let thumbnail = "";

  const hdRegexes = [
    /(?:playable_url_quality_hd|browser_native_hd_url|hd_src)[^\w]+(https?.*?)(?=\\"|"|'|&quot;)/i,
    /"playable_url_quality_hd":"([^"]+)"/
  ];

  const sdRegexes = [
    /(?:playable_url|browser_native_sd_url|sd_src|video_src)[^\w]+(https?.*?)(?=\\"|"|'|&quot;)/i,
    /"playable_url":"([^"]+)"/,
    /meta property="og:video" content="([^"]+)"/
  ];

  for (const regex of hdRegexes) {
    const match = html.match(regex);
    if (match && match[1]) {
      hdUrl = decodeFBUrl(match[1]);
      break;
    }
  }

  for (const regex of sdRegexes) {
    const match = html.match(regex);
    if (match && match[1]) {
      sdUrl = decodeFBUrl(match[1]);
      break;
    }
  }

  // اسکنر اضطراری CDN
  if (!sdUrl) {
    const fbcdnRegex = /(https?[:\\\/]+[^\s"'`<>]+?fbcdn\.net[^\s"'`<>]+?)(?=\\"|"|'|&quot;|\s|$)/gi;
    const allMatches = html.match(fbcdnRegex) || [];
    for (const rawMatch of allMatches) {
      const decoded = decodeFBUrl(rawMatch);
      if (decoded.includes("/v/") || decoded.includes(".mp4") || decoded.includes("cat=")) {
        if (!sdUrl) {
          sdUrl = decoded;
        } else if (!hdUrl && decoded !== sdUrl) {
          hdUrl = decoded;
          break;
        }
      }
    }
  }

  const thumbRegexes = [
    /meta property="og:image" content="([^"]+)"/,
    /"thumbnailUrl":"([^"]+)"/
  ];
  for (const regex of thumbRegexes) {
    const match = html.match(regex);
    if (match && match[1]) {
      thumbnail = decodeFBUrl(match[1]);
      break;
    }
  }

  const finalHd = hdUrl || sdUrl;
  const finalSd = sdUrl || hdUrl;

  if (!finalSd) return null;

  return { sdUrl: finalSd, hdUrl: finalHd, thumbnail };
}

/**
 * 🚀 اسکرپر چندموتوره مجهز به حل‌کننده لینک‌های کوتاه فیسبوک
 */
async function scrapeFacebookVideo(url: string): Promise<NativeScrapeResult> {
  let targetUrl = url;
  const randomUserAgent = USER_AGENTS[0]; // اولویت با ایجنت موبایل

  // 🔹 گام ۰: حل کردن لینک‌های کوتاه شده (share/v)
  if (url.includes("facebook.com/share") || url.includes("fb.watch") || url.includes("fb.com")) {
    try {
      console.log("[Resolver] Resolving short/share link redirects...");
      const res = await axios.head(url, {
        headers: { "User-Agent": USER_AGENTS[2] },
        maxRedirects: 5
      });
      if (res.request?.res?.responseUrl) {
        targetUrl = res.request.res.responseUrl;
        console.log("[Resolver] Successfully expanded URL to:", targetUrl);
      }
    } catch (e) {
      console.warn("[Resolver] Link expansion failed, using original URL.");
    }
  }

  // 🔹 موتور اول (جدید و قدرتمند): Gateway موبایل فیسبوک
  try {
    const mobileUrl = targetUrl
      .replace("www.facebook.com", "m.facebook.com")
      .replace("web.facebook.com", "m.facebook.com");
    
    console.log("[Scraper] Running Engine 1 (Mobile Gateway Scan):", mobileUrl);
    const response = await axios.get(mobileUrl, {
      headers: { "User-Agent": randomUserAgent, "Cache-Control": "no-cache" },
      timeout: 10000
    });

    const result = extractUrlsFromHtml(response.data);
    if (result) {
      console.log("[Scraper] Engine 1 (Mobile) fetched data successfully!");
      return result;
    }
  } catch (e) {
    console.warn("[Scraper] Engine 1 (Mobile) failed or timed out.");
  }

  // 🔹 موتور دوم: پورتال پلاگین امبد دسکتاپ
  try {
    const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(targetUrl)}`;
    console.log("[Scraper] Running Engine 2 (Embed Portal):", embedUrl);
    const response = await axios.get(embedUrl, {
      headers: { "User-Agent": USER_AGENTS[2], "Cache-Control": "no-cache" },
      timeout: 10000,
    });

    const result = extractUrlsFromHtml(response.data);
    if (result) {
      console.log("[Scraper] Engine 2 (Embed) fetched data successfully!");
      return result;
    }
  } catch (e) {
    console.warn("[Scraper] Engine 2 bypassed.");
  }

  throw new Error("Facebook security actively rejected the stream request. Please try another video link.");
}

function processMetadata(facebookUrl: string, scrapeData: NativeScrapeResult): VideoMetadata {
  const videoId = extractFacebookVideoId(facebookUrl) || "unknown";
  return {
    id: videoId,
    title: facebookUrl.includes("reel") ? "Facebook Reel" : "Facebook Video",
    thumbnail: scrapeData.thumbnail,
    duration: 0,
    qualities: [
      { quality: "720p", url: scrapeData.hdUrl },
      { quality: "480p", url: scrapeData.sdUrl },
      { quality: "360p", url: scrapeData.sdUrl },
    ],
    mediaType: facebookUrl.includes("reel") ? "reel" : "video",
    sourceUrl: facebookUrl,
  };
}

export const facebookDownloaderRouter = router({
  extractVideo: publicProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input }): Promise<APISuccessResponse<VideoMetadata> | APIErrorResponse> => {
      try {
        if (!isValidFacebookUrl(input.url)) {
          return { success: false, error: "Invalid Facebook URL." };
        }
        const scrapeResult = await scrapeFacebookVideo(input.url);
        return { success: true, data: processMetadata(input.url, scrapeResult) };
      } catch (error) {
        return { success: false, error: extractErrorMessage(error) };
      }
    }),

  getDownloadUrl: publicProcedure
    .input(z.object({ url: z.string().url(), quality: z.enum(["360p", "480p", "720p"]) }))
    .mutation(async ({ input }) => {
      try {
        const scrapeResult = await scrapeFacebookVideo(input.url);
        const selectedUrl = input.quality === "720p" ? scrapeResult.hdUrl : scrapeResult.sdUrl;
        return { success: true, data: { url: selectedUrl, quality: input.quality, title: "Facebook Media" } };
      } catch (error) {
        return { success: false, error: extractErrorMessage(error) };
      }
    }),

  validateUrl: publicProcedure
    .input(z.object({ url: z.string() }))
    .query(({ input }) => {
      const isValid = isValidFacebookUrl(input.url);
      return { isValid, videoId: isValid ? extractFacebookVideoId(input.url) : null };
    }),
});