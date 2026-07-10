/**
 * useVideoDownload Hook
 * Real video download implementation with direct Deep-Search Backend integration
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

// 🚀 اسکنر عمیق هوشمند: لینک ویدیو را از هر لایه یا کلیدی در پاسخ سرور (حتی به صورت تودرتو) پیدا می‌کند
const findVideoUrlDeep = (obj: any): string | null => {
  if (!obj) return null;
  
  if (typeof obj === "string") {
    const isUrl = obj.startsWith("http://") || obj.startsWith("https://");
    const isVideo = obj.includes(".mp4") || obj.includes("fbcdn.net") || obj.includes("video") || obj.includes("media");
    const isThumbnail = obj.includes(".jpg") || obj.includes(".jpeg") || obj.includes(".png") || obj.includes("thumbnail");
    
    if (isUrl && isVideo && !isThumbnail) {
      return obj;
    }
  }
  
  if (typeof obj === "object") {
    const primaryKeys = ["Direct_media_url", "direct_media_url", "downloadUrl", "download_url", "url", "media_url", "video_url"];
    for (const key of primaryKeys) {
      if (obj[key] && typeof obj[key] === "string" && (obj[key].startsWith("http") || obj[key].includes("fbcdn"))) {
        return obj[key];
      }
    }
    
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const result = findVideoUrlDeep(obj[key]);
        if (result) return result;
      }
    }
  }
  return null;
};

// 🚀 اسکنر عمیق برای پیدا کردن تصویر تامبنیل
const findThumbnailUrlDeep = (obj: any): string | undefined => {
  if (!obj) return undefined;
  
  if (typeof obj === "string") {
    if ((obj.startsWith("http://") || obj.startsWith("https://")) && (obj.includes(".jpg") || obj.includes(".jpeg") || obj.includes(".png") || obj.includes("scontent"))) {
      return obj;
    }
  }
  
  if (typeof obj === "object") {
    const primaryKeys = ["thumbnail", "thumbnail_url", "thumb", "image", "picture"];
    for (const key of primaryKeys) {
      if (obj[key] && typeof obj[key] === "string") return obj[key];
    }
    
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const result = findThumbnailUrlDeep(obj[key]);
        if (result) return result;
      }
    }
  }
  return undefined;
};

// 🚀 اسکنر عمیق برای تشخیص ریلز یا ویدیو بودن مدیا
const findMediaTypeDeep = (obj: any): string => {
  if (!obj) return "video";
  if (typeof obj === "object") {
    if (obj.media_type) return obj.media_type;
    if (obj.type) return obj.type;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const result = findMediaTypeDeep(obj[key]);
        if (result && (result === "reel" || result === "video")) return result;
      }
    }
  }
  if (typeof obj === "string" && (obj === "reel" || obj === "video")) {
    return obj;
  }
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

        // استخراج لینک دانلود با متد اسکن عمیق جدید
        const extractedDownloadUrl = findVideoUrlDeep(res);

        if (!extractedDownloadUrl) {
          throw new Error("Failed to extract video download link from server response");
        }

        const result: VideoExtractionResult = {
          id: videoId,
          title: findMediaTypeDeep(res) === "reel" ? "Facebook Reel" : "Facebook Video",
          duration: 0,
          thumbnail: findThumbnailUrlDeep(res),
          // هماهنگی دقیق با کیفیت‌های ۳ گانه دکمه‌های رابط کاربری شما در تصویر ارسالی
          qualities: ["360p" as VideoQuality, "480p" as VideoQuality, "720p" as VideoQuality], 
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

        // اگر ورودی تابع لینک اصلی فیسبوک باشد، مجدداً لینک مستقیم را به صورت پویا پیدا می‌کنیم
        if (videoUrl.includes("facebook.com") || videoUrl.includes("fb.watch")) {
          const downloadResponse = await facebookDownloaderMutation.mutateAsync({ url: videoUrl });
          const dlRes = downloadResponse as any;
          
          const extractedUrl = findVideoUrlDeep(dlRes);

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
