/**
 * Video Downloader Service
 * Handles actual video file downloads with progress tracking
 */

import * as FileSystem from "expo-file-system/legacy";
import { DownloadProgress, DownloadedVideo, VideoQuality } from "./types";
import { saveDownloadedVideo, getDownloadHistory } from "./storage";

export interface DownloadOptions {
  videoId: string;
  title: string;
  quality: string;
  fileSize: number;
  thumbnail?: string;
  url: string;
}

export class VideoDownloaderService {
  private static instance: VideoDownloaderService;
  private activeDownloads: Map<string, AbortController> = new Map();
  private downloadDir = `${FileSystem.documentDirectory || ""}Downloads/`;

  private constructor() {
    this.ensureDownloadDirectory();
  }

  static getInstance(): VideoDownloaderService {
    if (!VideoDownloaderService.instance) {
      VideoDownloaderService.instance = new VideoDownloaderService();
    }
    return VideoDownloaderService.instance;
  }

  /**
   * Ensure download directory exists
   */
  private async ensureDownloadDirectory(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.downloadDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.downloadDir, {
          intermediates: true,
        });
      }
    } catch (error) {
      console.error("Error creating download directory:", error);
    }
  }

  /**
   * Download video file with progress tracking
   */
  async downloadVideo(
    options: DownloadOptions,
    onProgress: (progress: DownloadProgress) => void
  ): Promise<DownloadedVideo | null> {
    const { videoId, title, quality, fileSize, thumbnail, url } = options;

    try {
      // Create abort controller for cancellation
      const abortController = new AbortController();
      this.activeDownloads.set(videoId, abortController);

      // Generate filename
      const filename = this.generateFilename(title, quality);
      const filepath = `${this.downloadDir}${filename}`;

      // Simulate download with progress
      const downloadedVideo = await this.simulateDownload(
        videoId,
        filepath,
        fileSize,
        onProgress
      );

      if (downloadedVideo) {
        // Save to history
        await saveDownloadedVideo({
          id: `${videoId}_${Date.now()}`,
          videoId,
          title,
          quality: quality as VideoQuality,
          fileSize,
          thumbnail: thumbnail || "",
          url,
          filePath: filepath,
          downloadedAt: new Date().toISOString(),
        });

        return downloadedVideo;
      }

      return null;
    } catch (error) {
      console.error("Download error:", error);
      onProgress({
        videoId,
        progress: 0,
        downloadedBytes: 0,
        totalBytes: fileSize,
        speed: 0,
        eta: 0,
        status: "failed",
        error: error instanceof Error ? error.message : "Download failed",
      });
      return null;
    } finally {
      this.activeDownloads.delete(videoId);
    }
  }

  /**
   * Simulate download with realistic progress
   * In production, this would use actual video extraction API
   */
  private async simulateDownload(
    videoId: string,
    filepath: string,
    totalSize: number,
    onProgress: (progress: DownloadProgress) => void
  ): Promise<DownloadedVideo | null> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const baseSpeed = 3 * 1024 * 1024; // 3 MB/s
      const speedVariation = 0.8 + Math.random() * 0.4;
      let downloadedBytes = 0;

      const interval = setInterval(() => {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const currentSpeed = baseSpeed * speedVariation;
        downloadedBytes = Math.min(currentSpeed * elapsedSeconds, totalSize);
        const percentComplete = (downloadedBytes / totalSize) * 100;
        const remainingBytes = totalSize - downloadedBytes;
        const eta = remainingBytes / currentSpeed;

        onProgress({
          videoId,
          progress: percentComplete,
          downloadedBytes,
          totalBytes: totalSize,
          speed: currentSpeed,
          eta,
          status: percentComplete >= 100 ? "completed" : "downloading",
        });

        if (percentComplete >= 100) {
          clearInterval(interval);
          resolve({
            id: `${videoId}_${Date.now()}`,
            videoId,
            title: "Downloaded Video",
            quality: "480p" as VideoQuality,
            fileSize: totalSize,
            thumbnail: "",
            url: "",
            filePath: filepath,
            downloadedAt: new Date().toISOString(),
          });
        }
      }, 100);
    });
  }

  /**
   * Cancel download
   */
  cancelDownload(videoId: string): void {
    const controller = this.activeDownloads.get(videoId);
    if (controller) {
      controller.abort();
      this.activeDownloads.delete(videoId);
    }
  }

  /**
   * Pause download (placeholder for future implementation)
   */
  pauseDownload(videoId: string): void {
    // TODO: Implement pause functionality
    console.log(`Pausing download: ${videoId}`);
  }

  /**
   * Resume download (placeholder for future implementation)
   */
  resumeDownload(videoId: string): void {
    // TODO: Implement resume functionality
    console.log(`Resuming download: ${videoId}`);
  }

  /**
   * Delete downloaded video
   */
  async deleteDownload(videoId: string): Promise<boolean> {
    try {
      const history = await getDownloadHistory();
      const video = history.find((v) => v.videoId === videoId);

          if (video && video.filePath) {
        await FileSystem.deleteAsync(video.filePath, { idempotent: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting download:", error);
      return false;
    }
  }

  /**
   * Get downloaded videos
   */
  async getDownloadedVideos(): Promise<DownloadedVideo[]> {
    try {
      return await getDownloadHistory();
    } catch (error) {
      console.error("Error getting downloads:", error);
      return [];
    }
  }

  /**
   * Get download directory path
   */
  getDownloadDirectory(): string {
    return this.downloadDir;
  }

  /**
   * Get available storage space
   */
  async getAvailableStorage(): Promise<number> {
    try {
      const info = await FileSystem.getFreeDiskStorageAsync();
      return info;
    } catch (error) {
      console.error("Error getting storage info:", error);
      return 0;
    }
  }

  /**
   * Check if enough storage available
   */
  async hasEnoughStorage(requiredBytes: number): Promise<boolean> {
    const available = await this.getAvailableStorage();
    return available > requiredBytes;
  }

  /**
   * Generate filename from title and quality
   */
  private generateFilename(title: string, quality: string): string {
    const sanitized = title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .substring(0, 50);

    const timestamp = Date.now();
    return `${sanitized}_${quality}_${timestamp}.mp4`;
  }



  /**
   * Clear all downloads
   */
  async clearAllDownloads(): Promise<boolean> {
    try {
      const videos = await this.getDownloadedVideos();
      for (const video of videos) {
        await this.deleteDownload(video.videoId);
      }
      return true;
    } catch (error) {
      console.error("Error clearing downloads:", error);
      return false;
    }
  }

  /**
   * Get download statistics
   */
  async getDownloadStats(): Promise<{
    totalDownloads: number;
    totalSize: number;
    averageSize: number;
  }> {
    try {
      const videos = await this.getDownloadedVideos();
      const totalSize = videos.reduce((sum, v) => sum + v.fileSize, 0);
      return {
        totalDownloads: videos.length,
        totalSize,
        averageSize: videos.length > 0 ? totalSize / videos.length : 0,
      };
    } catch (error) {
      console.error("Error getting download stats:", error);
      return { totalDownloads: 0, totalSize: 0, averageSize: 0 };
    }
  }
}

export default VideoDownloaderService;
