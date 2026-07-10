/**
 * useVideoDownload Hook
 * Real video download implementation with direct Backend integration
 * Handles video extraction, quality selection, and actual file download
 */

import { useState, useCallback } from "react";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { Platform } from "react-native";
import { VideoQuality } from "@/lib/types";
import axios from "axios";
import { trpc } from "@/lib/trpc";
import { extractFacebookVideoId } from "@/lib/facebook-url-parser";

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

// 🛠 تابع کمکی هوشمند برای استخراج لینک دانلود از هر نوع ساختار پاسخ بک‌اند (حروف بزرگ/کوچک یا تو در تو)
const getMediaUrl = (res: any): string | null => {
  if (!res) return null;
  if (res.Direct_media_url) return res.Direct_media_url;
  if (res.direct_media_url) return res.direct_media_url;
  if (res.url) return res.url;
  if (res.data) {
    if (res.data.Direct_media_url) return res.data.Direct_media_url;
    if (res.data.direct_media_url) return res.data.direct_media_url;
    if (res.data.url) return res.data.url;
  }
  return null;
};

// 🛠 تابع کمکی هوشمند برای استخراج تامبنیل
const getThumbnailUrl = (res: any): string | undefined => {
  if (!res) return undefined;
  if (res.thumbnail) return res.thumbnail;
  if (res.data && res.data.thumbnail) return res.data.thumbnail;
  return undefined;
};

// 🛠 تابع کمکی هوشمند برای تشخیص نوع مدیا
const getMediaType = (res: any): string => {
  if (!res) return "video";
  if (res.media_type) return res.media_type;
  if (res.data && res.data.media_type) return res.data.media_type;
  return "video";
};

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
    const uint8Array = new Uint8Array(response.data);
    let binaryString = "";
    const chunkSize = 8192; 
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
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

  const facebookDownloaderMutation = trpc.facebookDownloader.extractVideo.useMutation();

  /**
   * Extract video metadata from Facebook URL using Backend API
   */
  const extractVideoMetadata = useCallback(
    async (url: string): Promise<VideoExtractionResult | null> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        if (!url || !url.includes("facebook.com")) {
          throw new Error("Invalid Facebook URL");
        }

        const videoId = extractFacebookVideoId(url);
        if (!videoId) {
          throw new Error("Could not extract video ID from URL. Please check the Facebook video link.");
        }

        const response = await facebookDownloaderMutation.mutateAsync({ url });
        const res = response as any;

        // استخراج لینک مستقیم با متد هوشمند جدید
        const extractedDownloadUrl = getMediaUrl(res);

        if (!extractedDownloadUrl) {
          throw new Error("Failed to extract video download link from server response");
        }

        const result: VideoExtractionResult = {
          id: videoId,
          title: getMediaType(res) === "reel" ? "Facebook Reel" : "Facebook Video",
          duration: 0,
          thumbnail: getThumbnailUrl(res),
          qualities: ["HD" as VideoQuality],
          downloadUrl: extractedDownloadUrl, 
          author: undefined,
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
        setState((prev) => ({ ...prev, loading: true, error: null, progress: 0 }));

        if (!videoUrl) {
          throw new Error("No video URL provided");
        }

        if (Platform.OS !== "web") {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status !== "granted") {
            throw new Error("Storage permission denied");
          }
        }

        setState((prev) => ({ ...prev, progress: 10 }));
        onProgress?.(10);

        let downloadUrl = videoUrl;

        // اگر ورودی تابع همچنان لینک خام فیسبوک باشد، آن را مجدداً به صورت پویا و هوشمند حل می‌کنیم
        if (videoUrl.includes("facebook.com") || videoUrl.includes("fb.watch")) {
          const downloadResponse = await facebookDownloaderMutation.mutateAsync({ url: videoUrl });
          const dlRes = downloadResponse as any;
          
          const extractedUrl = getMediaUrl(dlRes);

          if (!extractedUrl) {
            throw new Error("Failed to resolve direct download URL from backend response structure");
          }
          downloadUrl = extractedUrl;
        }

        const timestamp = Date.now();
        const filename = `FB_Video_${timestamp}_${quality}.mp4`;
        const fileUri = `${FileSystem.documentDirectory}${filename}`;

        setState((prev) => ({ ...prev, progress: 20 }));
        onProgress?.(20);

        try {
          await downloadFileWithProgress(downloadUrl, fileUri, (progress) => {
            const mappedProgress = 20 + progress * 0.7;
            setState((prev) => ({ ...prev, progress: Math.round(mappedProgress) }));
            onProgress?.(Math.round(mappedProgress));
          });
        } catch (downloadErr) {
          console.error("Download error:", downloadErr);
          throw new Error(
            downloadErr instanceof Error ? downloadErr.message : "Failed to download video"
          );
        }

        if (Platform.OS !== "web") {
          try {
            setState((prev) => ({ ...prev, progress: 90 }));
            onProgress?.(90);
            await MediaLibrary.createAssetAsync(fileUri);
          } catch (galleryErr) {
            console.warn("Gallery save failed:", galleryErr);
          }
        }

        setState((prev) => ({ ...prev, loading: false, progress: 100, success: true }));
        onProgress?.(100);

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Download failed";
        console.error("Download error:", errorMessage);
        setState((prev) => ({ ...prev, loading: false, error: errorMessage, success: false }));
        return false;
      }
    },
    [facebookDownloaderMutation]
  );

  const reset = useCallback(() => {
    setState({ loading: false, progress: 0, error: null, success: false });
  }, []);

  return {
    ...state,
    extractVideoMetadata,  
    downloadVideo,         
    reset,
  };
}
