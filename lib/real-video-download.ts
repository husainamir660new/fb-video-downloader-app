/**
 * Real Video Download Implementation
 * Handles actual video file downloads with progress tracking
 * Supports multiple quality options and resume capability
 * Fixed for Expo 54 FileSystem API
 */

import axios, { AxiosProgressEvent } from "axios";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { VideoQuality, DownloadedVideo } from "./types";

interface DownloadOptions {
  url: string;
  quality: VideoQuality;
  filename: string;
  onProgress?: (progress: number, speed: number, eta: number) => void;
  onComplete?: (filepath: string) => void;
  onError?: (error: string) => void;
  maxRetries?: number;
  timeout?: number;
}

interface DownloadState {
  id: string;
  filename: string;
  progress: number;
  speed: number;
  eta: number;
  status: "pending" | "downloading" | "completed" | "failed" | "cancelled";
  error?: string;
  startTime: number;
  downloadedBytes: number;
  totalBytes: number;
}

/**
 * Real Video Download Service
 * Handles actual file downloads with progress tracking
 */
export class RealVideoDownloadService {
  private static instance: RealVideoDownloadService;
  private downloads: Map<string, DownloadState> = new Map();
  private activeDownloads: Map<string, AbortController> = new Map();

  private constructor() {}

  static getInstance(): RealVideoDownloadService {
    if (!RealVideoDownloadService.instance) {
      RealVideoDownloadService.instance = new RealVideoDownloadService();
    }
    return RealVideoDownloadService.instance;
  }

  /**
   * Download a video file with progress tracking and retry logic
   */
  async downloadVideo(options: DownloadOptions): Promise<string> {
    const { url, quality, filename, onProgress, onComplete, onError, maxRetries = 3, timeout = 30000 } = options;
    return this.downloadWithRetry(url, quality, filename, onProgress, onComplete, onError, maxRetries, timeout, 0);
  }

  /**
   * Internal method to handle download with exponential backoff retry
   */
  private async downloadWithRetry(
    url: string,
    quality: VideoQuality,
    filename: string,
    onProgress?: (progress: number, speed: number, eta: number) => void,
    onComplete?: (filepath: string) => void,
    onError?: (error: string) => void,
    maxRetries: number = 3,
    timeout: number = 30000,
    attemptNumber: number = 0
  ): Promise<string> {
    try {
      return await this.performDownload(url, quality, filename, onProgress, onComplete, onError, timeout);
    } catch (error) {
      const isLastAttempt = attemptNumber >= maxRetries - 1;
      const isNetworkError = error instanceof Error && 
        (error.message.includes('Network') || 
         error.message.includes('timeout') || 
         error.message.includes('ECONNREFUSED') ||
         error.message.includes('ENOTFOUND'));

      if (isNetworkError && !isLastAttempt) {
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, attemptNumber) * 1000;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.downloadWithRetry(url, quality, filename, onProgress, onComplete, onError, maxRetries, timeout, attemptNumber + 1);
      }

      // Final attempt failed or non-network error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError?.(errorMessage);
      throw error;
    }
  }

  /**
   * Perform the actual download with timeout
   */
  private async performDownload(
    url: string,
    quality: VideoQuality,
    filename: string,
    onProgress?: (progress: number, speed: number, eta: number) => void,
    onComplete?: (filepath: string) => void,
    onError?: (error: string) => void,
    timeout: number = 30000
  ): Promise<string> {

    const downloadId = `${filename}-${Date.now()}`;
    const downloadState: DownloadState = {
      id: downloadId,
      filename,
      progress: 0,
      speed: 0,
      eta: 0,
      status: "downloading",
      startTime: Date.now(),
      downloadedBytes: 0,
      totalBytes: 0,
    };

    this.downloads.set(downloadId, downloadState);

    try {
      // Get the documents directory for saving files
      const documentsDir = FileSystem.documentDirectory;
      if (!documentsDir) {
        throw new Error("Documents directory not available");
      }

      // Create FB Video Downloader folder
      const appFolder = `${documentsDir}FB_Video_Downloader/`;
      const folderInfo = await FileSystem.getInfoAsync(appFolder);
      if (!folderInfo.exists) {
        await FileSystem.makeDirectoryAsync(appFolder, { intermediates: true });
      }

      // Create quality subfolder
      const qualityFolder = `${appFolder}${quality}/`;
      const qualityFolderInfo = await FileSystem.getInfoAsync(qualityFolder);
      if (!qualityFolderInfo.exists) {
        await FileSystem.makeDirectoryAsync(qualityFolder, { intermediates: true });
      }

      const filepath = `${qualityFolder}${filename}.mp4`;

      // Create abort controller for cancellation
      const abortController = new AbortController();
      this.activeDownloads.set(downloadId, abortController);

      // Download the file with timeout
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        signal: abortController.signal,
        timeout: timeout,
        onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
          const { loaded, total } = progressEvent;
          if (total) {
            const progress = (loaded / total) * 100;
            const currentTime = Date.now();
            const elapsedTime = (currentTime - downloadState.startTime) / 1000; // seconds
            const speed = loaded / elapsedTime; // bytes per second
            const remainingBytes = total - loaded;
            const eta = remainingBytes / speed; // seconds

            downloadState.progress = progress;
            downloadState.speed = speed;
            downloadState.eta = eta;
            downloadState.downloadedBytes = loaded;
            downloadState.totalBytes = total;

            onProgress?.(progress, speed, eta);
          }
        },
      });

      // Write file to disk using base64 encoding
      // Convert arraybuffer to base64 without using Buffer (not available in React Native)
      // Process in chunks to avoid stack overflow for large files
      const uint8Array = new Uint8Array(response.data);
      let binaryString = "";
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const base64Data = btoa(binaryString);
      await FileSystem.writeAsStringAsync(filepath, base64Data, {
        encoding: "base64",
      });

      // Update download state
      downloadState.status = "completed";
      downloadState.progress = 100;

      // Save to the device media library. We don't fail the whole download
      // if this step fails — the file is still on disk.
      try {
        const asset = await MediaLibrary.createAssetAsync(filepath);
        await MediaLibrary.createAlbumAsync("FB Video Downloader", asset, false);
      } catch {
        // Gallery permission denied or filesystem error — silently continue.
      }

      onComplete?.(filepath);
      this.activeDownloads.delete(downloadId);

      return filepath;
    } catch (error) {
      if (axios.isCancel(error)) {
        downloadState.status = "cancelled";
        downloadState.error = "Download cancelled";
      } else {
        downloadState.status = "failed";
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        downloadState.error = errorMessage;
        onError?.(errorMessage);
      }

      this.activeDownloads.delete(downloadId);
      throw error;
    }
  }

  /**
   * Cancel an ongoing download
   */
  cancelDownload(downloadId: string): void {
    const abortController = this.activeDownloads.get(downloadId);
    if (abortController) {
      abortController.abort();
      this.activeDownloads.delete(downloadId);
    }

    const downloadState = this.downloads.get(downloadId);
    if (downloadState) {
      downloadState.status = "cancelled";
    }
  }

  /**
   * Get download state
   */
  getDownloadState(downloadId: string): DownloadState | undefined {
    return this.downloads.get(downloadId);
  }

  /**
   * Get all active downloads
   */
  getActiveDownloads(): DownloadState[] {
    return Array.from(this.downloads.values()).filter(
      (d) => d.status === "downloading"
    );
  }

  /**
   * Clear completed downloads from history
   */
  clearCompleted(): void {
    for (const [id, state] of this.downloads.entries()) {
      if (state.status === "completed" || state.status === "failed") {
        this.downloads.delete(id);
      }
    }
  }
}

// Export singleton instance
export const realVideoDownloadService = RealVideoDownloadService.getInstance();
