import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import axios, { AxiosError } from "axios";
import { extractFacebookVideoId } from "../../lib/facebook-url-parser";

/**
 * ============================================================================
 * Facebook Video Downloader Router - Production Implementation
 * ============================================================================
 * 
 * API Provider: RapidAPI
 * Host: facebook-media-downloader1.p.rapidapi.com
 * Endpoint: POST /get_media
 * 
 * This router handles:
 * - Facebook URL validation
 * - Video metadata extraction via RapidAPI
 * - Download URL retrieval for selected quality
 * - Comprehensive error handling and logging
 * 
 * ============================================================================
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Response from RapidAPI /get_media endpoint
 * Flat structure - no nested data object
 */
interface RapidAPIMediaResponse {
  status: number;
  media_type?: string;
  direct_media_url?: string;
  thumbnail?: string;
  source_url?: string;
  error?: string;
  message?: string;
}

/**
 * Video quality option for frontend selection
 */
interface VideoQuality {
  quality: "360p" | "480p" | "720p";
  url: string;
}

/**
 * Extracted video metadata returned to frontend
 */
interface VideoMetadata {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  qualities: VideoQuality[];
  mediaType: string;
  sourceUrl: string;
}

/**
 * API error response structure
 */
interface APIErrorResponse {
  success: false;
  error: string;
}

/**
 * Successful API response structure
 */
interface APISuccessResponse<T> {
  success: true;
  data: T;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validates if a URL is a valid Facebook URL
 * Supports: facebook.com, fb.com, fb.watch
 */
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

/**
 * Validates RapidAPI response structure
 * Ensures required fields are present
 */
function validateRapidAPIResponse(
  response: unknown
): response is RapidAPIMediaResponse {
  if (!response || typeof response !== "object") {
    return false;
  }

  const data = response as Record<string, unknown>;
  
  // Check for required fields
  if (typeof data.status !== "number") {
    return false;
  }

  if (data.status !== 200) {
    return false;
  }

  if (typeof data.direct_media_url !== "string" || !data.direct_media_url) {
    return false;
  }

  return true;
}

/**
 * Extracts error message from various error types
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.statusText) {
      return `HTTP ${error.response.status}: ${error.response.statusText}`;
    }
    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error occurred";
}

/**
 * Calls RapidAPI /get_media endpoint
 * Returns parsed video metadata or throws error
 */
async function callRapidAPI(url: string): Promise<RapidAPIMediaResponse> {
  const apiKey = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;
  const apiHost = process.env.EXPO_PUBLIC_RAPIDAPI_HOST;

  if (!apiKey || !apiHost) {
    throw new Error("RapidAPI credentials not configured in environment");
  }

  console.log("[RapidAPI] Calling endpoint with URL:", url);

  try {
    const response = await axios.post(
      "https://facebook-media-downloader1.p.rapidapi.com/get_media",
      { url },
      {
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": apiHost,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    console.log("[RapidAPI] Response status:", response.status);
    console.log("[RapidAPI] Response data:", JSON.stringify(response.data, null, 2));

    if (!validateRapidAPIResponse(response.data)) {
      console.error("[RapidAPI] Invalid response structure:", response.data);
      throw new Error("API returned invalid response structure");
    }

    return response.data;
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    console.error("[RapidAPI] API call failed:", errorMessage);
    throw new Error(`RapidAPI request failed: ${errorMessage}`);
  }
}

/**
 * Extracts video metadata from RapidAPI response
 */
function extractMetadata(
  facebookUrl: string,
  apiResponse: RapidAPIMediaResponse
): VideoMetadata {
  const videoId = extractFacebookVideoId(facebookUrl) || "unknown";
  const directUrl = apiResponse.direct_media_url!;

  // All qualities point to same URL until provider supports multiple qualities
  const qualities: VideoQuality[] = [
    { quality: "720p", url: directUrl },
    { quality: "480p", url: directUrl },
    { quality: "360p", url: directUrl },
  ];

  return {
    id: videoId,
    title: "Facebook Video",
    thumbnail: apiResponse.thumbnail || "",
    duration: 0,
    qualities,
    mediaType: apiResponse.media_type || "video",
    sourceUrl: apiResponse.source_url || facebookUrl,
  };
}

// ============================================================================
// tRPC Router
// ============================================================================

export const facebookDownloaderRouter = router({
  /**
   * Extract video metadata from Facebook URL
   * 
   * Input: Facebook video URL
   * Output: Video metadata with available qualities
   */
  extractVideo: publicProcedure
    .input(
      z.object({
        url: z.string().url("Invalid URL format"),
      })
    )
    .mutation(
      async ({ input }): Promise<APISuccessResponse<VideoMetadata> | APIErrorResponse> => {
        try {
          console.log("[extractVideo] Starting extraction for URL:", input.url);

          // Validate Facebook URL
          if (!isValidFacebookUrl(input.url)) {
            console.warn("[extractVideo] Invalid Facebook URL:", input.url);
            return {
              success: false,
              error: "Invalid Facebook URL. Please provide a valid Facebook video link.",
            };
          }

          // Extract video ID
          const videoId = extractFacebookVideoId(input.url);
          if (!videoId) {
            console.warn("[extractVideo] Could not extract video ID from URL:", input.url);
            return {
              success: false,
              error: "Could not extract video ID from URL. Please check the link.",
            };
          }

          console.log("[extractVideo] Video ID extracted:", videoId);

          // Call RapidAPI
          const apiResponse = await callRapidAPI(input.url);

          // Extract metadata
          const metadata = extractMetadata(input.url, apiResponse);

          console.log("[extractVideo] Metadata extracted successfully");
          console.log("[extractVideo] Qualities available:", metadata.qualities.length);

          return {
            success: true,
            data: metadata,
          };
        } catch (error) {
          const errorMessage = extractErrorMessage(error);
          console.error("[extractVideo] Extraction failed:", errorMessage);

          return {
            success: false,
            error: errorMessage,
          };
        }
      }
    ),

  /**
   * Get download URL for specific quality
   * 
   * Input: Facebook URL + desired quality
   * Output: Direct download URL for the video
   */
  getDownloadUrl: publicProcedure
    .input(
      z.object({
        url: z.string().url("Invalid URL format"),
        quality: z.enum(["360p", "480p", "720p"]),
      })
    )
    .mutation(
      async ({
        input,
      }): Promise<
        APISuccessResponse<{ url: string; quality: string; title: string }> | APIErrorResponse
      > => {
        try {
          console.log("[getDownloadUrl] Getting URL for quality:", input.quality);

          // Validate Facebook URL
          if (!isValidFacebookUrl(input.url)) {
            console.warn("[getDownloadUrl] Invalid Facebook URL:", input.url);
            return {
              success: false,
              error: "Invalid Facebook URL",
            };
          }

          // Call RapidAPI to get current download URL
          const apiResponse = await callRapidAPI(input.url);

          if (!apiResponse.direct_media_url) {
            console.error("[getDownloadUrl] No direct media URL in response");
            return {
              success: false,
              error: "Could not retrieve download URL",
            };
          }

          console.log("[getDownloadUrl] Download URL retrieved successfully");

          return {
            success: true,
            data: {
              url: apiResponse.direct_media_url,
              quality: input.quality,
              title: "Facebook Video",
            },
          };
        } catch (error) {
          const errorMessage = extractErrorMessage(error);
          console.error("[getDownloadUrl] Failed to get download URL:", errorMessage);

          return {
            success: false,
            error: errorMessage,
          };
        }
      }
    ),

  /**
   * Validate if a URL is a valid Facebook video
   * 
   * Input: URL string
   * Output: Validation result with video ID if valid
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

        console.log("[validateUrl] URL validation:", { isValid, videoId });

        return {
          isValid,
          videoId,
        };
      } catch (error) {
        console.error("[validateUrl] Validation error:", error);
        return {
          isValid: false,
          videoId: null,
        };
      }
    }),
});
