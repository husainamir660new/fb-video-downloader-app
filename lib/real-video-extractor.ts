/**
 * Real Facebook Video Extraction Service
 * Uses yt-dlp API for actual video extraction
 * Fallback to mock service if API unavailable
 */

import { VideoMetadata, VideoQuality } from "./types";
import { MockVideoService } from "./mock-video-service";

export interface ExtractionResult {
  success: boolean;
  data?: VideoMetadata;
  error?: string;
  source: "real" | "mock";
}

export interface VideoFormat {
  format_id: string;
  format: string;
  ext: string;
  resolution: string;
  filesize?: number;
  fps?: number;
  vcodec?: string;
  acodec?: string;
}

export class RealVideoExtractionService {
  private static instance: RealVideoExtractionService;
  private mockService = MockVideoService.getInstance();
  private apiBaseUrl = "https://api.allorigins.win/raw?url=";
  private ytDlpApiUrl = "https://yt-dlp-api.herokuapp.com/api/info";

  private constructor() {}

  static getInstance(): RealVideoExtractionService {
    if (!RealVideoExtractionService.instance) {
      RealVideoExtractionService.instance = new RealVideoExtractionService();
    }
    return RealVideoExtractionService.instance;
  }

  /**
   * Extract video metadata from Facebook URL
   * Tries real API first, falls back to mock service
   */
  async extractVideoMetadata(url: string): Promise<ExtractionResult> {
    try {
      // Validate URL format
      if (!this.isValidFacebookUrl(url)) {
        return {
          success: false,
          error: "Invalid Facebook URL format",
          source: "mock",
        };
      }

      // Try real extraction first
      const realResult = await this.tryRealExtraction(url);
      if (realResult.success) {
        return realResult;
      }

      // Fallback to mock service
      console.log("Real extraction failed, using mock service");
      const mockResult = await this.tryMockExtraction(url);
      return mockResult;
    } catch (error) {
      console.error("Video extraction error:", error);
      // Fallback to mock service on any error
      return this.tryMockExtraction(url);
    }
  }

  /**
   * Try real video extraction using yt-dlp API
   */
  private async tryRealExtraction(url: string): Promise<ExtractionResult> {
    try {
      // Extract video ID from URL
      const videoId = this.extractVideoId(url);
      if (!videoId) {
        throw new Error("Could not extract video ID");
      }

      // Attempt yt-dlp API call
      const response = await fetch(this.ytDlpApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      // Parse response and extract metadata
      const metadata = this.parseYtDlpResponse(data, videoId, url);

      return {
        success: true,
        data: metadata,
        source: "real",
      };
    } catch (error) {
      console.error("Real extraction failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        source: "real",
      };
    }
  }

  /**
   * Fallback to mock extraction
   */
  private async tryMockExtraction(url: string): Promise<ExtractionResult> {
    try {
      const videoId = this.extractVideoId(url);
      if (!videoId) {
        return {
          success: false,
          error: "Could not extract video ID",
          source: "mock",
        };
      }

      const metadata = await this.mockService.extractVideoMetadata(videoId);

      if (metadata) {
        return {
          success: true,
          data: metadata,
          source: "mock",
        };
      }

      return {
        success: false,
        error: "Video not found",
        source: "mock",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        source: "mock",
      };
    }
  }

  /**
   * Parse yt-dlp API response
   */
  private parseYtDlpResponse(
    data: any,
    videoId: string,
    url: string
  ): VideoMetadata {
    const formats = data.formats || [];
    const info = data.info || {};

    // Extract file sizes for different qualities
    const fileSizes: Record<VideoQuality, number> = {
      "720p": 125 * 1024 * 1024, // 125 MB default
      "480p": 65 * 1024 * 1024, // 65 MB default
      "360p": 30 * 1024 * 1024, // 30 MB default
    };

    // Try to extract actual file sizes from formats
    formats.forEach((format: VideoFormat) => {
      if (format.filesize) {
        if (format.resolution?.includes("720")) {
          fileSizes["720p"] = format.filesize;
        } else if (format.resolution?.includes("480")) {
          fileSizes["480p"] = format.filesize;
        } else if (format.resolution?.includes("360")) {
          fileSizes["360p"] = format.filesize;
        }
      }
    });

    return {
      id: videoId,
      title: data.title || info.title || "Facebook Video",
      duration: data.duration || info.duration || 0,
      thumbnail:
        data.thumbnail ||
        info.thumbnail ||
        "https://via.placeholder.com/400x300?text=Video+Thumbnail",
      url,
      fileSize: fileSizes,
    };
  }

  /**
   * Validate Facebook URL format
   */
  private isValidFacebookUrl(url: string): boolean {
    const facebookUrlPatterns = [
      /facebook\.com\/watch/,
      /facebook\.com\/.*\/videos/,
      /fb\.watch/,
      /m\.facebook\.com\/watch/,
    ];

    return facebookUrlPatterns.some((pattern) => pattern.test(url));
  }

  /**
   * Extract video ID from Facebook URL
   */
  private extractVideoId(url: string): string | null {
    try {
      // Pattern: facebook.com/watch/?v=VIDEO_ID
      const watchMatch = url.match(/[?&]v=(\d+)/);
      if (watchMatch) {
        return watchMatch[1];
      }

      // Pattern: facebook.com/USERNAME/videos/VIDEO_ID
      const videoMatch = url.match(/\/videos\/(\d+)/);
      if (videoMatch) {
        return videoMatch[1];
      }

      // Pattern: fb.watch/VIDEO_ID
      const fbWatchMatch = url.match(/fb\.watch\/(\w+)/);
      if (fbWatchMatch) {
        return fbWatchMatch[1];
      }

      // Generate ID from URL hash if no ID found
      return `video_${Date.now()}`;
    } catch (error) {
      console.error("Error extracting video ID:", error);
      return null;
    }
  }

  /**
   * Get available quality options for a video
   */
  getAvailableQualities(metadata: VideoMetadata): VideoQuality[] {
    if (!metadata.fileSize) {
      return ["720p", "480p", "360p"];
    }

    return (Object.keys(metadata.fileSize) as VideoQuality[]).filter(
      (quality) => metadata.fileSize![quality] > 0
    );
  }

  /**
   * Get file size for specific quality
   */
  getFileSizeForQuality(
    metadata: VideoMetadata,
    quality: VideoQuality
  ): number {
    if (!metadata.fileSize) {
      return 0;
    }
    return metadata.fileSize[quality] || 0;
  }

  /**
   * Format file size to human readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Format duration to readable string
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }
}

export default RealVideoExtractionService;
