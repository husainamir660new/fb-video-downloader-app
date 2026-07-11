/**
 * useVideoDownload Hook
 * Real video download implementation with Dynamic Debugger
 * Optimized for Free Native Backend Scraper
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

const findVideoUrlDeep = (obj: any): string | null => {
  if (!obj) return null;
  if (typeof obj === "string") {
    const isUrl = obj.startsWith("http://") || obj.startsWith("https://");
    
    // 🌟 اصلاح طلایی: جلوگیری از اشتباه گرفتن لینک اصلی فیسبوک با لینک دانلود ویدیو
    const isVideo = (obj.includes(".mp4") || obj.includes("fbcdn.net") || obj.includes("video") || obj.includes("media")) 
                    && !obj.includes("facebook.com") 
                    && !obj.includes("fb.watch");
                    
    const isThumbnail = obj.includes(".jpg") || obj.includes(".jpeg") || obj.includes(".png") || obj.includes("thumbnail");
    if (isUrl && isVideo && !isThumbnail) return obj;
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
  return "video";
};

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
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
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
    await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "Failed to download file");
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

  const extractVideoMetadata = useCallback(
    async (url: string): Promise<VideoExtractionResult | null> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        if (!url || (!url.includes("facebook.com") && !url.includes("fb.watch") && !url.includes("fb.com"))) {
          throw new Error("Invalid Facebook URL");
        }

        const videoId = extractFacebookVideoId(url);
        if (!videoId) {
          throw new Error("Could not extract video ID from URL.");
        }

        const response = await facebookDownloaderMutation.mutateAsync({ url });
        const res = response as any;

        const extractedDownloadUrl = findVideoUrlDeep(res);

        if (!extractedDownloadUrl) {
          const backendError = res?.error || res?.message || res?.data?.error || res?.data?.message;
          if (backendError) {
            throw new Error(`Backend Msg: ${backendError}`);
          }
          throw new Error("Server Sent: " + JSON.stringify(res).substring(0, 100));
        }

        const result: VideoExtractionResult = {
          id: videoId,
          title: findMediaTypeDeep(res) === "reel" ? "Facebook Reel" : "Facebook Video",
          duration: 0,
          thumbnail: findThumbnailUrlDeep(res),
          qualities: ["360p" as VideoQuality, "480p" as VideoQuality, "720p" as VideoQuality], 
          downloadUrl: extractedDownloadUrl, 
          author: undefined,
        };

        setState((prev) => ({ ...prev, loading: false }));
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to extract video";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
        console.error("Extract metadata error:", errorMessage);
        return null;
      }
    },
    [facebookDownloaderMutation]
  );

  const downloadVideo = useCallback(
    async (
      videoUrl: string,
      quality: VideoQuality,
      onProgress?: (progress: number) => void
    ): Promise<boolean> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null, progress: 0 }));

        if (!videoUrl) throw new Error("No video URL provided");

        if (Platform.OS !== "web") {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status !== "granted") throw new Error("Storage permission denied");
        }

        setState((prev) => ({ ...prev, progress: 10 }));
        onProgress?.(10);

        let downloadUrl = videoUrl;

        if (videoUrl.includes("facebook.com") || videoUrl.includes("fb.watch") || videoUrl.includes("fb.com")) {
          const downloadResponse = await facebookDownloaderMutation.mutateAsync({ url: videoUrl });
          const dlRes = downloadResponse as any;
          const extractedUrl = findVideoUrlDeep(dlRes);

          if (!extractedUrl) {
            const innerError = dlRes?.error || dlRes?.message || JSON.stringify(dlRes);
            throw new Error(`DL Bridge Error: ${innerError.substring(0, 80)}`);
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
          throw new Error(downloadErr instanceof Error ? downloadErr.message : "Failed to download video");
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
        const errorMessage = err instanceof Error ? err.message : "Download failed";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage, success: false }));
        return false;
      }
    },
    [facebookDownloaderMutation]
  );

  const reset = useCallback(() => {
    setState({ loading: false, progress: 0, error: null, success: false });
  }, []);

  return { ...state, extractVideoMetadata, downloadVideo, reset };
}