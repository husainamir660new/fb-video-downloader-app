/**
 * Download Service - Handles video extraction and download logic
 * TODO: Integrate with actual video extraction API
 */

import * as FileSystem from "expo-file-system/legacy";
import { DownloadedVideo, VideoMetadata, VideoQuality, DownloadProgress } from "./types";
import { saveDownloadedVideo } from "./storage";

export interface DownloadOptions {
  quality: VideoQuality;
  onProgress?: (progress: DownloadProgress) => void;
}

export class DownloadService {
  private static instance: DownloadService;
  private downloadDirectory: string;

  private constructor() {
    this.downloadDirectory = `${FileSystem.documentDirectory}downloads/`;
  }

  static getInstance(): DownloadService {
    if (!DownloadService.instance) {
      DownloadService.instance = new DownloadService();
    }
    return DownloadService.instance;
  }

  /**
   * Initialize download directory
   */
  async initializeDownloadDirectory(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.downloadDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.downloadDirectory, {
          intermediates: true,
        });
      }
    } catch (error) {
      console.error("Error initializing download directory:", error);
    }
  }

  /**
   * Extract video metadata from Facebook URL
   * TODO: Replace with actual API call to video extraction service
   */
  async extractVideoMetadata(url: string): Promise<VideoMetadata | null> {
    try {
      // Mock implementation - replace with actual API call
      const videoId = this.extractVideoId(url);
      if (!videoId) return null;

      // TODO: Call actual video extraction API
      // Example: const response = await fetch('https://api.example.com/extract', { ... })

      return {
        id: videoId,
        title: "Facebook Video",
        duration: 120,
        thumbnail: "",
        url: url,
        fileSize: {
          "720p": 125 * 1024 * 1024,
          "480p": 65 * 1024 * 1024,
          "360p": 35 * 1024 * 1024,
        },
      };
    } catch (error) {
      console.error("Error extracting video metadata:", error);
      return null;
    }
  }

  /**
   * Download video from Facebook
   * TODO: Implement actual download logic
   */
  async downloadVideo(
    metadata: VideoMetadata,
    options: DownloadOptions
  ): Promise<DownloadedVideo | null> {
    try {
      await this.initializeDownloadDirectory();

      const fileName = `${metadata.id}_${options.quality}.mp4`;
      const filePath = `${this.downloadDirectory}${fileName}`;

      // TODO: Implement actual download using video extraction API
      // For now, simulate download progress
      const totalBytes = metadata.fileSize?.[options.quality] || 50 * 1024 * 1024;
      const startTime = Date.now();

      // Simulate download progress
      for (let i = 0; i <= 100; i += 10) {
        const elapsedTime = (Date.now() - startTime) / 1000;
        const downloadedBytes = (totalBytes * i) / 100;
        const speed = downloadedBytes / Math.max(elapsedTime, 0.1);
        const remainingBytes = totalBytes - downloadedBytes;
        const eta = remainingBytes / Math.max(speed, 1);

        if (options.onProgress) {
          options.onProgress({
            videoId: metadata.id,
            progress: i,
            downloadedBytes,
            totalBytes,
            speed,
            eta,
            status: i === 100 ? "completed" : "downloading",
          });
        }

        // Simulate delay
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Create downloaded video record
      const downloadedVideo: DownloadedVideo = {
        id: `${metadata.id}_${Date.now()}`,
        videoId: metadata.id,
        title: metadata.title,
        thumbnail: metadata.thumbnail,
        quality: options.quality,
        fileSize: totalBytes,
        filePath: filePath,
        downloadedAt: Date.now(),
        url: metadata.url,
      };

      // Save to storage
      await saveDownloadedVideo(downloadedVideo);

      return downloadedVideo;
    } catch (error) {
      console.error("Error downloading video:", error);
      if (options.onProgress) {
        options.onProgress({
          videoId: metadata.id,
          progress: 0,
          downloadedBytes: 0,
          totalBytes: 0,
          speed: 0,
          eta: 0,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
      return null;
    }
  }

  /**
   * Cancel ongoing download
   */
  async cancelDownload(videoId: string): Promise<void> {
    try {
      // TODO: Implement cancellation logic
      console.log(`Download cancelled for video: ${videoId}`);
    } catch (error) {
      console.error("Error cancelling download:", error);
    }
  }

  /**
   * Delete downloaded video file
   */
  async deleteDownloadedFile(filePath: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  }

  /**
   * Get download directory size
   */
  async getDownloadDirectorySize(): Promise<number> {
    try {
      const files = await FileSystem.readDirectoryAsync(this.downloadDirectory);
      let totalSize = 0;

      for (const file of files) {
        const filePath = `${this.downloadDirectory}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.size) {
          totalSize += fileInfo.size;
        }
      }

      return totalSize;
    } catch (error) {
      console.error("Error calculating directory size:", error);
      return 0;
    }
  }

  /**
   * Clear all downloads
   */
  async clearAllDownloads(): Promise<void> {
    try {
      const files = await FileSystem.readDirectoryAsync(this.downloadDirectory);
      for (const file of files) {
        const filePath = `${this.downloadDirectory}${file}`;
        await FileSystem.deleteAsync(filePath);
      }
    } catch (error) {
      console.error("Error clearing downloads:", error);
    }
  }

  /**
   * Extract video ID from Facebook URL
   */
  private extractVideoId(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get("v");
      if (videoId) return videoId;

      const pathMatch = urlObj.pathname.match(/\/video\.php\?v=(\d+)/);
      if (pathMatch) return pathMatch[1];

      const fbWatchMatch = urlObj.pathname.match(/\/(\w+)$/);
      if (fbWatchMatch) return fbWatchMatch[1];

      return null;
    } catch {
      return null;
    }
  }
}

export default DownloadService;
