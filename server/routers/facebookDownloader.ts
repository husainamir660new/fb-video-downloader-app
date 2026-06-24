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
 * Supports all Facebook URL formats with improved regex patterns
 */
function extractVideoIdFromUrl(url: string): string | null {
  try {
    const patterns = [
      // facebook.com/watch?v=VIDEO_ID or m.facebook.com/watch?v=VIDEO_ID
      /[?&]v=([a-zA-Z0-9_-]+)/,
      // facebook.com/USERNAME/videos/VIDEO_ID
      /\/videos\/([a-zA-Z0-9_-]+)/,
      // facebook.com/share/r/VIDEO_ID (short share link)
      /\/share\/r\/([a-zA-Z0-9_-]+)/,
      // facebook.com/share/v/VIDEO_ID
      /\/share\/v\/([a-zA-Z0-9_-]+)/,
      // facebook.com/share/VIDEO_ID (direct share)
      /\/share\/([a-zA-Z0-9_-]+)(?:\/|\?|$)/,
      // facebook.com/reel/VIDEO_ID
      /\/reel\/([a-zA-Z0-9_-]+)/,
      // fb.watch/VIDEO_ID
      /fb\.watch\/([a-zA-Z0-9_-]+)/,
      // Generic: v/VIDEO_ID
      /\/v\/([a-zA-Z0-9_-]+)/,
      // Generic: video.php?v=VIDEO_ID
      /video\.php\?v=([a-zA-Z0-9_-]+)/,
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
 * ✅ FIXED: Using correct endpoint and host
 */
async function extractVideoFromRapidAPI(
  url: string
): Promise<FacebookVideoMetadata | null> {
  try {
    const apiKey = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;

    if (!apiKey) {
      throw new Error("RapidAPI credentials not configured");
    }

    // ✅ FIXED: Correct endpoint and host
    const response = await axios.get(
      "https://facebook-video-downloader9.p.rapidapi.com/api/v1/videos/download",
      {
        params: {
          url: url,
        },
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "facebook-video-downloader9.p.rapidapi.com",
        },
        timeout: 15000,
      }
     );

    const data = response.data;

    // ✅ FIXED: Parse new response format
    if (data.status !== "success" || !data.data) {
      throw new Error("Invalid response from RapidAPI");
    }

    const videoData = data.data;
    const videoInfo = videoData.video || {};
    const downloadData = videoData.download || {};

    // Parse response and extract metadata
    const metadata: FacebookVideoMetadata = {
      id: videoInfo.id || extractVideoIdFromUrl(url) || "unknown",
      title: videoInfo.title || "Facebook Video",
      description: videoInfo.description || undefined,
      duration: videoInfo.duration_ms || 0,
      thumbnail: videoInfo.thumbnail_url || undefined,
      qualities: [],
      author: videoInfo.author || undefined,
      uploadDate: videoInfo.uploadDate || undefined,
    };

    // ✅ FIXED: Extract quality options from new format
    if (downloadData.sd && downloadData.sd.url) {
      metadata.qualities.push({
        quality: downloadData.sd.quality || "SD",
        url: downloadData.sd.url,
        size: undefined,
      });
    }

    if (downloadData.hd && downloadData.hd.url) {
      metadata.qualities.push({
        quality: downloadData.hd.quality || "HD",
        url: downloadData.hd.url,
        size: undefined,
      });
    }

    // Ensure we have at least some quality
    if (metadata.qualities.length === 0) {
      throw new Error("No download URLs available");
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
      urlObj.hostname.includes("fb.com") ||
      urlObj.hostname.includes("m.facebook.com")
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
        quality: z.enum(["SD", "HD", "360p", "480p", "720p", "1080p"]),
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