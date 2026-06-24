/**
 * useVideoDownload Hook
 * Real video download implementation with RapidAPI and Backend integration
 * Handles video extraction, quality selection, and actual file download
 */

import { useState, useCallback } from "react";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { Platform } from "react-native";
import { VideoMetadata, VideoQuality } from "@/lib/types";
import axios from "axios";
import { trpc } from "@/lib/trpc";

interface DownloadState {
  loading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

interface VideoExtractionResult {
  id: string;
  title: string;
  duration: number;
  thumbnail?: string;
  qualities: VideoQuality[];
  downloadUrl?: string;
  author?: string;
}

/**
 * Simple Facebook video URL parser
 * Extracts video ID from various Facebook URL formats
 */
function extractVideoIdFromUrl(url: string): string | null {
  try {
    // Handle various Facebook URL formats
    const patterns = [
      /(?:facebook\.com|fb\.com)\/(?:watch\/\?v=|video\.php\?v=)(\d+)/,
      /(?:facebook\.com|fb\.com)\/(?:watch|video)\/(\d+)/,
      /(?:facebook\.com|fb\.com)\/share\/v\/(\d+)/,
      /(?:facebook\.com|fb\.com)\/share\/r\/([a-zA-Z0-9]+)/,
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
 * Download file with progress tracking
 */
async function downloadFileWithProgress(
  url: string,
  fileUri: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      onDownloadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded / progressEvent.total) * 100
          );
          onProgress?.(progress);
        }
      },
    });

    // Write file to device
    // ✅ FIXED: Convert ArrayBuffer to base64 without Buffer
    const binaryString = String.fromCharCode.apply(
      null,
      Array.from(new Uint8Array(response.data))
    );
    const base64 = btoa(binaryString);
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : "Failed to download file"
    );
  }
}

export function useVideoDownload() {
  const [state, setState] = useState<DownloadState>({
    loading: false,
    progress: 0,
    error: null,
    success: false,
  });

  // Get tRPC client for backend calls
  const facebookDownloaderMutation = trpc.facebookDownloader.extractVideo.useMutation();
  const getDownloadUrlMutation = trpc.facebookDownloader.getDownloadUrl.useMutation();

  /**
   * Extract video metadata from Facebook URL using Backend API
   */
  const extractVideoMetadata = useCallback(
    async (url: string): Promise<VideoExtractionResult | null> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        // Validate URL
        if (!url || !url.includes("facebook.com")) {
          throw new Error("Invalid Facebook URL");
        }

        // Extract video ID
        const videoId = extractVideoIdFromUrl(url);
        if (!videoId) {
          throw new Error("Could not extract video ID from URL");
        }

        // Call Backend API to extract metadata using RapidAPI
        const response = await facebookDownloaderMutation.mutateAsync({
          url: url,
        });

        if (!response.success || !response.data) {
          throw new Error(response.error || "Failed to extract video metadata");
        }

        const data = response.data;

        // Convert to expected format
        const result: VideoExtractionResult = {
          id: data.id,
          title: data.title,
          duration: data.duration,
          thumbnail: data.thumbnail,
          qualities: data.qualities.map((q: any) => q.quality as VideoQuality),
          author: data.author,
        };

        setState((prev) => ({ ...prev, loading: false }));
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to extract video";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        console.error("Extract metadata error:", errorMessage);
        return null;
      }
    },
    [facebookDownloaderMutation]
  );

  /**
   * Download video file to device storage
   */
  const downloadVideo = useCallback(
    async (
      videoUrl: string,
      quality: VideoQuality,
      onProgress?: (progress: number) => void
    ): Promise<boolean> => {
      try {
        setState((prev) => ({
          ...prev,
          loading: true,
          error: null,
          progress: 0,
        }));

        if (!videoUrl) {
          throw new Error("No video URL provided");
        }

        // Request permissions on native platforms
        if (Platform.OS !== "web") {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status !== "granted") {
            throw new Error("Storage permission denied");
          }
        }

        // Get actual download URL from Backend API
        setState((prev) => ({ ...prev, progress: 10 }));
        onProgress?.(10);

        const downloadResponse = await getDownloadUrlMutation.mutateAsync({
          url: videoUrl,
          quality: quality,
        });

        if (!downloadResponse.success || !downloadResponse.url) {
          throw new Error(
            downloadResponse.error || "Failed to get download URL"
          );
        }

        const downloadUrl = downloadResponse.url;
        const title = downloadResponse.title || "Facebook Video";

        // Create filename
        const timestamp = Date.now();
        const filename = `FB_Video_${timestamp}_${quality}.mp4`;
        const fileUri = `${FileSystem.documentDirectory}${filename}`;

        // Download file with progress
        setState((prev) => ({ ...prev, progress: 20 }));
        onProgress?.(20);

        try {
          await downloadFileWithProgress(downloadUrl, fileUri, (progress) => {
            // Map 20-90% to download progress
            const mappedProgress = 20 + progress * 0.7;
            setState((prev) => ({ ...prev, progress: Math.round(mappedProgress) }));
            onProgress?.(Math.round(mappedProgress));
          });
        } catch (downloadErr) {
          console.error("Download error:", downloadErr);
          throw new Error(
            downloadErr instanceof Error
              ? downloadErr.message
              : "Failed to download video"
          );
        }

        // Save to gallery on native platforms
        if (Platform.OS !== "web") {
          try {
            setState((prev) => ({ ...prev, progress: 90 }));
            onProgress?.(90);

            await MediaLibrary.createAssetAsync(fileUri);
          } catch (galleryErr) {
            console.warn("Gallery save failed:", galleryErr);
            // Continue anyway - file is still saved
          }
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          progress: 100,
          success: true,
        }));
        onProgress?.(100);

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Download failed";
        console.error("Download error:", errorMessage);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
          success: false,
        }));
        return false;
      }
    },
    [getDownloadUrlMutation]
  );

  /**
   * Reset download state
   */
  const reset = useCallback(() => {
    setState({
      loading: false,
      progress: 0,
      error: null,
      success: false,
    });
  }, []);

  return {
    ...state,
    extractVideoMetadata,
    downloadVideo,
    reset,
  };
}
