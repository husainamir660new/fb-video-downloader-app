import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import axios from "axios";
import { extractFacebookVideoId } from "../../lib/facebook-url-parser";

/**
 * Facebook Video Downloader Router
 * Handles video extraction and metadata retrieval using RapidAPI
 * 
 * NEW API IMPLEMENTATION (2026):
 * - Endpoint: https://facebook-media-downloader1.p.rapidapi.com/info
 * - Response: { status, media_type, direct_media_url, thumbnail, source_url }
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
  thumbnail: string;
  qualities: VideoQualityInfo[];
  mediaType?: string;
  directMediaUrl?: string;
  sourceUrl?: string;
}

/**
 * Call RapidAPI to extract video metadata
 * New API returns: { status, media_type, direct_media_url, thumbnail, source_url }
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

    console.log("[RapidAPI] Extracting video from URL:", url);

    // Call RapidAPI endpoint
    const response = await axios.get(
      "https://facebook-media-downloader1.p.rapidapi.com/info",
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

    console.log("[RapidAPI] Response status:", data.status);
    console.log("[RapidAPI] Media type:", data.media_type);

    // Validate API response
    if (data.status !== 200) {
      throw new Error(`API returned status: ${data.status}`);
    }

    if (!data.direct_media_url) {
      throw new Error("No direct media URL in response");
    }

    // Parse response and extract metadata
    const metadata: FacebookVideoMetadata = {
      id: extractFacebookVideoId(url) || "unknown",
      title: "Facebook Video", // New API doesn't provide title
      description: undefined,
      duration: 0, // New API doesn't provide duration
      thumbnail: data.thumbnail || "",
      mediaType: data.media_type || "video",
      directMediaUrl: data.direct_media_url,
      sourceUrl: data.source_url,
      qualities: [
        {
          quality: "720p",
          url: data.direct_media_url,
          size: undefined,
        },
        {
          quality: "480p",
          url: data.direct_media_url, // Same URL, will be downscaled on client
          size: undefined,
        },
        {
          quality: "360p",
          url: data.direct_media_url, // Same URL, will be downscaled on client
          size: undefined,
        },
      ],
    };

    console.log("[RapidAPI] Metadata extracted successfully");
    return metadata;
  } catch (error: any) {
    console.error("[RapidAPI] Extraction error:", error.message);
    console.error("[RapidAPI] Error details:", error.response?.data || error);
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

        // Extract video ID using advanced parser
        const videoId = extractFacebookVideoId(input.url);
        if (!videoId) {
          throw new Error("Could not extract video ID from URL");
        }

        console.log("[extractVideo] Processing URL:", input.url);
        console.log("[extractVideo] Video ID:", videoId);

        // Extract metadata from RapidAPI
        const metadata = await extractVideoFromRapidAPI(input.url);

        if (!metadata) {
          throw new Error("Failed to extract video metadata");
        }

        console.log("[extractVideo] Success - returning metadata");

        return {
          success: true,
          data: metadata,
        };
      } catch (error: any) {
        console.error("[extractVideo] Error:", error);
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

        console.log("[getDownloadUrl] Quality:", input.quality);

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

          console.log("[getDownloadUrl] Quality not found, returning best:", bestQuality.quality);

          return {
            success: true,
            url: bestQuality.url,
            quality: bestQuality.quality,
            title: metadata.title,
          };
        }

        console.log("[getDownloadUrl] Returning URL for quality:", input.quality);

        return {
          success: true,
          url: qualityInfo.url,
          quality: input.quality,
          title: metadata.title,
        };
      } catch (error: any) {
        console.error("[getDownloadUrl] Error:", error);
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
        const videoId = isValid ? extractFacebookVideoId(input.url) : null;

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
