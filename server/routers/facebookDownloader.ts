import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import axios, { AxiosError } from "axios";
import { extractFacebookVideoId } from "../../lib/facebook-url-parser";

/**
 * ============================================================================
 * Facebook Video Downloader Router - Free Stealth Plugin Embed Scraper
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
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0"
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

/**
 * 🚀 اسکرپر بومی با ترفند فیسبوک Embed برای دور زدن فیلتر دیتاسنتر Render
 */
async function scrapeFacebookVideo(url: string): Promise<NativeScrapeResult> {
  // 🌟 تبدیل لینک اصلی به لینک ابزار امبد فیسبوک برای دور زدن فایروال ضدبات
  const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
  const randomUserAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  
  console.log("[EmbedScraper] Fetching video via plugin portal:", embedUrl);

  try {
    const response = await axios.get(embedUrl, {
      headers: {
        "User-Agent": randomUserAgent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache"
      },
      timeout: 15000,
    });

    const html = response.data;

    const decodeFBUrl = (rawUrl: string): string => {
      try {
        return JSON.parse(`"${rawUrl}"`);
      } catch {
        return rawUrl.replace(/\\\/ /g, "/").replace(/\\/g, "");
      }
    };

    // ۱. استخراج لینک HD از ساختار داده‌های امبد
    let hdUrl = "";
    const hdRegexes = [
      /"playable_url_quality_hd":"([^"]+)"/,
      /"browser_native_hd_url":"([^"]+)"/,
      /hd_src:"([^"]+)"/
    ];
    for (const regex of hdRegexes) {
      const match = html.match(regex);
      if (match && match[1]) {
        hdUrl = decodeFBUrl(match[1]);
        break;
      }
    }

    // ۲. استخراج لینک SD
    let sdUrl = "";
    const sdRegexes = [
      /"playable_url":"([^"]+)"/,
      /"browser_native_sd_url":"([^"]+)"/,
      /sd_src:"([^"]+)"/,
      /meta property="og:video" content="([^"]+)"/
    ];
    for (const regex of sdRegexes) {
      const match = html.match(regex);
      if (match && match[1]) {
        sdUrl = decodeFBUrl(match[1]);
        break;
      }
    }

    // ۳. استخراج تصویر کاور (Thumbnail)
    let thumbnail = "";
    const thumbRegexes = [
      /"preferred_thumbnail":{"image":{"uri":"([^"]+)"}}/,
      /meta property="og:image" content="([^"]+)"/
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

    if (!finalSd) {
      throw new Error("Unable to locate media streams in Facebook response.");
    }

    return { sdUrl: finalSd, hdUrl: finalHd, thumbnail };

  } catch (error) {
    console.error("[EmbedScraper] Error:", error);
    throw new Error("Facebook security rejected the request. Please try again in a few moments.");
  }
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