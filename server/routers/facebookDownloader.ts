import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import axios, { AxiosError } from "axios";
import { extractFacebookVideoId } from "../../lib/facebook-url-parser";

/**
 * ============================================================================
 * Facebook Video Downloader Router - 100% Free Stealth Native Scraper
 * ============================================================================
 * 
 * Fully independent of RapidAPI.
 * Implements User-Agent Rotation to bypass Facebook's scraping blocks.
 * 
 * ============================================================================
 */

// ============================================================================
// Type Definitions
// ============================================================================

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

// 🚀 لیستی از هویت‌های مختلف مرورگرها برای دور زدن سیستم امنیتی فیسبوک
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Safari/604.1"
];

// ============================================================================
// Helper Functions
// ============================================================================

function isValidFacebookUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    return (
      hostname.includes("facebook.com") ||
      hostname.includes("fb.com") ||
      hostname.includes("fb.watch")
    );
  } catch {
    return false;
  }
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response?.data?.message) return error.response.data.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error occurred";
}

/**
 * 🚀 اسکرپر بومی با انتخاب هدر تصادفی
 */
async function scrapeFacebookVideo(url: string): Promise<NativeScrapeResult> {
  // انتخاب یک مرورگر کاملاً تصادفی برای هر درخواست دانلود
  const randomUserAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  console.log("[NativeScraper] Scraping with User-Agent:", randomUserAgent.substring(0, 40) + "...");

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": randomUserAgent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      },
      timeout: 12000,
    });

    const html = response.data;

    const decodeFBUrl = (rawUrl: string): string => {
      try {
        return JSON.parse(`"${rawUrl}"`);
      } catch {
        return rawUrl.replace(/\\\/ /g, "/").replace(/\\/g, "");
      }
    };

    // ۱. استخراج لینک HD
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
      /meta property="og:video" content="([^"]+)"/,
      /meta property="og:video:secure_url" content="([^"]+)"/
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

    if (!finalSd) {
      throw new Error("Could not find any video stream. The video might be private or age-restricted.");
    }

    return {
      sdUrl: finalSd,
      hdUrl: finalHd,
      thumbnail: thumbnail
    };

  } catch (error) {
    console.error("[NativeScraper] Scraping failed:", error);
    throw new Error("Facebook security rejected the request. Please try again in a few moments.");
  }
}

function processMetadata(
  facebookUrl: string,
  scrapeData: NativeScrapeResult
): VideoMetadata {
  const videoId = extractFacebookVideoId(facebookUrl) || "unknown";

  const qualities: VideoQuality[] = [
    { quality: "720p", url: scrapeData.hdUrl },
    { quality: "480p", url: scrapeData.sdUrl },
    { quality: "360p", url: scrapeData.sdUrl },
  ];

  return {
    id: videoId,
    title: facebookUrl.includes("reel") ? "Facebook Reel" : "Facebook Video",
    thumbnail: scrapeData.thumbnail,
    duration: 0,
    qualities,
    mediaType: facebookUrl.includes("reel") ? "reel" : "video",
    sourceUrl: facebookUrl,
  };
}

// ============================================================================
// tRPC Router
// ============================================================================

export const facebookDownloaderRouter = router({
  extractVideo: publicProcedure
    .input(z.object({ url: z.string().url("Invalid URL format") }))
    .mutation(
      async ({ input }): Promise<APISuccessResponse<VideoMetadata> | APIErrorResponse> => {
        try {
          console.log("[extractVideo] Custom stealth extraction starting for:", input.url);

          if (!isValidFacebookUrl(input.url)) {
            return {
              success: false,
              error: "Invalid Facebook URL. Please provide a valid Facebook link.",
            };
          }

          const videoId = extractFacebookVideoId(input.url);
          if (!videoId) {
            return {
              success: false,
              error: "Could not parse video ID from the provided URL.",
            };
          }

          const scrapeResult = await scrapeFacebookVideo(input.url);
          const metadata = processMetadata(input.url, scrapeResult);

          return {
            success: true,
            data: metadata,
          };
        } catch (error) {
          return {
            success: false,
            error: extractErrorMessage(error),
          };
        }
      }
    ),

  getDownloadUrl: publicProcedure
    .input(
      z.object({
        url: z.string().url("Invalid URL format"),
        quality: z.enum(["360p", "480p", "720p"]),
      })
    )
    .mutation(
      async ({ input }): Promise<APISuccessResponse<{ url: string; quality: string; title: string }> | APIErrorResponse> => {
        try {
          if (!isValidFacebookUrl(input.url)) {
            return { success: false, error: "Invalid Facebook URL" };
          }

          const scrapeResult = await scrapeFacebookVideo(input.url);
          const selectedUrl = input.quality === "720p" ? scrapeResult.hdUrl : scrapeResult.sdUrl;

          return {
            success: true,
            data: {
              url: selectedUrl,
              quality: input.quality,
              title: input.url.includes("reel") ? "Facebook Reel" : "Facebook Video",
            },
          };
        } catch (error) {
          return {
            success: false,
            error: extractErrorMessage(error),
          };
        }
      }
    ),

  validateUrl: publicProcedure
    .input(z.object({ url: z.string() }))
    .query(({ input }) => {
      try {
        const isValid = isValidFacebookUrl(input.url);
        const videoId = isValid ? extractFacebookVideoId(input.url) : null;
        return { isValid, videoId };
      } catch (error) {
        return { isValid: false, videoId: null };
      }
    }),
});
