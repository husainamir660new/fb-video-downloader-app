import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import axios from "axios";

/**
 * Facebook Video Downloader Router
 * Handles video extraction and metadata retrieval using RapidAPI
 */

interface VideoQualityInfo {
  quality: string;
  url: string;
  size?: number;
}

interface FacebookVideoMetadata {
  id: string;
  title: string;
  description?: string;
  duration: number;
  thumbnail?: string;
  qualities: VideoQualityInfo[];
  author?: string;
  uploadDate?: string;
}

/**
 * Extract video ID from Facebook URL
 */
function extractVideoIdFromUrl(url: string): string | null {
  try {
    const patterns = [
      /(?:facebook\.com|fb\.com)\/(?:watch\/\?v=|video\.php\?v=)(\d+)/,
      /(?:facebook\.com|fb\.com)\/(?:watch|video)\/(\d+)/,
      /(?:facebook\.com|fb\.com)\/share\/v\/(\d+)/,
      /v\/(\d+)/,
      /video\.php\?v=(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Call RapidAPI to extract video metadata
 */
async function extractVideoFromRapidAPI(
  url: string
): Promise<FacebookVideoMetadata | null> {
  try {
    const apiKey = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;
    const apiHost = process.env.EXPO_PUBLIC_RAPIDAPI_HOST;

    if (!apiKey || !apiHost) {
      throw new Error("RapidAPI credentials not configured");
    }

    // Call RapidAPI endpoint
    const response = await axios.get(
      "https://facebook-video-downloader-api.p.rapidapi.com/info",
      {
        params: {
          url: url,
        },
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": apiHost,
        },
        timeout: 15000,
      }
     );

    const data = response.data;

    // Parse response and extract metadata
    const metadata: FacebookVideoMetadata = {
      id: extractVideoIdFromUrl(url) || "unknown",
      title: data.title || "Facebook Video",
      description: data.description || undefined,
      duration: data.duration || 0,
      thumbnail: data.thumbnail || undefined,
      qualities: [],
      author: data.author || undefined,
      uploadDate: data.uploadDate || undefined,
    };

    // Extract quality options
    if (data.links && typeof data.links === "object") {
      Object.entries(data.links).forEach(([quality, url]: [string, any]) => {
        if (typeof url === "string") {
          metadata.qualities.push({
            quality: quality,
            url: url,
            size: undefined,
          });
        }
      });
    }

    // Ensure we have at least some quality
    if (metadata.qualities.length === 0) {
      metadata.qualities.push({
        quality: "480p",
        url: data.url || "",
      });
    }

    return metadata;
  } catch (error: any) {
    console.error("RapidAPI extraction error:", error.message);
    throw new Error(
      `Failed to extract video: ${error.message || "Unknown error"}`
    );
  }
}

/**
 * Validate Facebook URL
 */
function isValidFacebookUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname.includes("facebook.com") ||
      urlObj.hostname.includes("fb.com")
    );
  } catch {
    return false;
  }
}

export const facebookDownloaderRouter = router({
  /**
   * Extract video metadata from Facebook URL
   */
  extractVideo: publicProcedure
    .input(
      z.object({
        url: z.string().url("Invalid URL format"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Validate URL
        if (!isValidFacebookUrl(input.url)) {
          throw new Error("Invalid Facebook URL");
        }

        // Extract video ID
        const videoId = extractVideoIdFromUrl(input.url);
        if (!videoId) {
          throw new Error("Could not extract video ID from URL");
        }

        // Extract metadata from RapidAPI
        const metadata = await extractVideoFromRapidAPI(input.url);

        if (!metadata) {
          throw new Error("Failed to extract video metadata");
        }

        return {
          success: true,
          data: metadata,
        };
      } catch (error: any) {
        console.error("Extract video error:", error);
        return {
          success: false,
          error: error.message || "Failed to extract video",
        };
      }
    }),

  /**
   * Get download URL for specific quality
   */
  getDownloadUrl: publicProcedure
    .input(
      z.object({
        url: z.string().url("Invalid URL format"),
        quality: z.enum(["360p", "480p", "720p", "1080p"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Validate URL
        if (!isValidFacebookUrl(input.url)) {
          throw new Error("Invalid Facebook URL");
        }

        // Extract metadata
        const metadata = await extractVideoFromRapidAPI(input.url);

        if (!metadata) {
          throw new Error("Failed to extract video");
        }

        // Find quality
        const qualityInfo = metadata.qualities.find(
          (q) => q.quality === input.quality
        );

        if (!qualityInfo || !qualityInfo.url) {
          // Return best available quality
          const bestQuality = metadata.qualities[0];
          if (!bestQuality) {
            throw new Error("No download URL available");
          }

          return {
            success: true,
            url: bestQuality.url,
            quality: bestQuality.quality,
            title: metadata.title,
          };
        }

        return {
          success: true,
          url: qualityInfo.url,
          quality: input.quality,
          title: metadata.title,
        };
      } catch (error: any) {
        console.error("Get download URL error:", error);
        return {
          success: false,
          error: error.message || "Failed to get download URL",
        };
      }
    }),

  /**
   * Validate if URL is a valid Facebook video
   */
  validateUrl: publicProcedure
    .input(
      z.object({
        url: z.string(),
      })
    )
    .query(({ input }) => {
      try {
        const isValid = isValidFacebookUrl(input.url);
        const videoId = isValid ? extractVideoIdFromUrl(input.url) : null;

        return {
          isValid,
          videoId,
        };
      } catch {
        return {
          isValid: false,
          videoId: null,
        };
      }
    }),
});
