import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import axios from "axios";
import { extractFacebookVideoId } from "../../lib/facebook-url-parser";

/**
 * Facebook Video Downloader Router
 * Handles video extraction and metadata retrieval using Official RapidAPI
 * 
 * OFFICIAL API IMPLEMENTATION:
 * - Method: POST
 * - Endpoint: https://facebook-media-downloader1.p.rapidapi.com/get_media
 * - Host: facebook-media-downloader1.p.rapidapi.com
 * - Content-Type: application/json
 * - Body: { url: "facebook_video_url" }
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

interface RapidAPIResponse {
  status: number;
  data?: {
    url?: string;
    urls?: Array<{
      quality: string;
      url: string;
    }>;
    thumbnail?: string;
    title?: string;
    duration?: number;
    media_type?: string;
  };
  error?: string;
  message?: string;
}

/**
 * Call Official RapidAPI to extract video metadata
 * POST /get_media endpoint
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
    console.log("[RapidAPI] Using Host:", apiHost);

    // Call Official RapidAPI endpoint with POST method
    const response = await axios.post(
      "https://facebook-media-downloader1.p.rapidapi.com/get_media",
      {
        url: url,
      },
      {
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": apiHost,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
     );

    const data: RapidAPIResponse = response.data;

    console.log("[RapidAPI] Response status:", data.status);
    console.log("[RapidAPI] Response data:", JSON.stringify(data, null, 2));

    // Validate API response
    if (data.status !== 200) {
      throw new Error(`API returned status: ${data.status} - ${data.message || data.error || "Unknown error"}`);
    }

    if (!data.data) {
      throw new Error("No data in API response");
    }

    const mediaData = data.data;

    // Extract download URL - try multiple formats
    let downloadUrl: string | null = null;

    // Try direct URL first
    if (mediaData.url) {
      downloadUrl = mediaData.url;
    }

    // Try URLs array (multiple qualities)
    if (!downloadUrl && mediaData.urls && Array.isArray(mediaData.urls) && mediaData.urls.length > 0) {
      // Find highest quality
      const sortedUrls = mediaData.urls.sort((a, b) => {
        const qualityOrder = { "720p": 3, "480p": 2, "360p": 1, "1080p": 4 };
        const aOrder = qualityOrder[a.quality as keyof typeof qualityOrder] || 0;
        const bOrder = qualityOrder[b.quality as keyof typeof qualityOrder] || 0;
        return bOrder - aOrder;
      });
      downloadUrl = sortedUrls[0].url;
    }

    if (!downloadUrl) {
      throw new Error("No download URL found in API response");
    }

    // Build qualities array
    let qualities: VideoQualityInfo[] = [];

    if (mediaData.urls && Array.isArray(mediaData.urls)) {
      // Use provided qualities
      qualities = mediaData.urls.map((q: any) => ({
        quality: q.quality || "unknown",
        url: q.url,
        size: undefined,
      }));
    } else {
      // Fallback: use single URL for all qualities
      qualities = [
        {
          quality: "720p",
          url: downloadUrl,
          size: undefined,
        },
        {
          quality: "480p",
          url: downloadUrl,
          size: undefined,
        },
        {
          quality: "360p",
          url: downloadUrl,
          size: undefined,
        },
      ];
    }

    // Parse response and extract metadata
    const metadata: FacebookVideoMetadata = {
      id: extractFacebookVideoId(url) || "unknown",
      title: mediaData.title || "Facebook Video",
      description: undefined,
      duration: mediaData.duration || 0,
      thumbnail: mediaData.thumbnail || "",
      mediaType: mediaData.media_type || "video",
      directMediaUrl: downloadUrl,
      sourceUrl: url,
      qualities: qualities,
    };

    console.log("[RapidAPI] Metadata extracted successfully");
    console.log("[RapidAPI] Download URL:", downloadUrl);
    console.log("[RapidAPI] Qualities:", qualities.length);

    return metadata;
  } catch (error: any) {
    console.error("[RapidAPI] Extraction error:", error.message);
    console.error("[RapidAPI] Error status:", error.response?.status);
    console.error("[RapidAPI] Error data:", error.response?.data);
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
      urlObj.hostname.includes("fb.watch")
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
          throw new Error("Could not extract video ID from URL. Please check the Facebook video link.");
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
        console.error("[extractVideo] Error:", error.message);
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
        console.error("[getDownloadUrl] Error:", error.message);
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
