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
  private backendApiUrl = process.env.EXPO_PUBLIC_BACKEND_API_URL || 
    "https://fb-video-downloader-app-backend.onrender.com";

  private constructor( ) {}

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
      return this.tryMockExtraction(url);
    } catch {
      // Network errors, etc — degrade to mock service
      return this.tryMockExtraction(url);
    }
  }

  /**
   * Try real video extraction using backend tRPC API
   * Falls back to mock service if backend is unavailable
   */
  private async tryRealExtraction(url: string): Promise<ExtractionResult> {
    try {
      // Extract video ID from URL
      const videoId = this.extractVideoId(url);
      if (!videoId) {
        throw new Error("Could not extract video ID");
      }

      // If backend URL not configured, skip real extraction
      if (!this.backendApiUrl) {
        throw new Error("Backend API URL not configured");
      }

      // Call backend tRPC endpoint with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for API calls

      try {
        const response = await fetch(`${this.backendApiUrl}/api/trpc/facebookDownloader.extractVideo`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();

        // Handle tRPC response format
        if (data.error) {
          throw new Error(data.error.message || "Backend error");
        }

        const result = data.result?.data;
        if (!result) {
          throw new Error("Invalid backend response format");
        }

        // Parse response and extract metadata
        const metadata = this.parseBackendResponse(result, videoId, url);

        return {
          success: true,
          data: metadata,
          source: "real",
        };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
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
   * Parse backend API response
   */
  private parseBackendResponse(
    data: Record<string, unknown>,
    videoId: string,
    url: string
  ): VideoMetadata {
    const formats = (Array.isArray(data.formats) ? data.formats : []) as VideoFormat[];
    const title = typeof data.title === 'string' ? data.title : 'Facebook Video';
    const duration = typeof data.duration === 'number' ? data.duration : 0;
    const thumbnail = typeof data.thumbnail === 'string' ? data.thumbnail : '';

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
      title,
      duration,
      thumbnail,
      url,
      fileSize: fileSizes,
    };
  }

  /**
   * Validate Facebook URL format
   * Supports: watch, videos, share/r, share/v, share/ID, reel, m.facebook.com, fb.watch
   */
  private isValidFacebookUrl(url: string): boolean {
    const facebookUrlPatterns = [
      /facebook\.com\/watch/,
      /facebook\.com\/.*\/videos/,
      /facebook\.com\/share\/r\//,
      /facebook\.com\/share\/v\//,
      /facebook\.com\/share\/[a-zA-Z0-9_-]+/,
      /facebook\.com\/reel\/[a-zA-Z0-9_-]+/,
      /fb\.watch/,
      /m\.facebook\.com\/watch/,
      /m\.facebook\.com\/share/,
    ];

    return facebookUrlPatterns.some((pattern) => pattern.test(url));
  }

  /**
   * Extract video ID from Facebook URL
   * Supports all Facebook URL formats:
   * - facebook.com/watch?v=ID
   * - facebook.com/username/videos/ID
   * - facebook.com/share/r/ID
   * - facebook.com/share/v/ID
   * - facebook.com/share/ID
   * - facebook.com/reel/ID
   * - fb.watch/ID
   * - m.facebook.com/watch?v=ID
   */
  private extractVideoId(url: string): string | null {
    try {
      // Pattern 1: facebook.com/watch?v=VIDEO_ID or m.facebook.com/watch?v=VIDEO_ID
      const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      if (watchMatch && watchMatch[1]) {
        return watchMatch[1];
      }

      // Pattern 2: facebook.com/USERNAME/videos/VIDEO_ID
      const videoMatch = url.match(/\/videos\/([a-zA-Z0-9_-]+)/);
      if (videoMatch && videoMatch[1]) {
        return videoMatch[1];
      }

      // Pattern 3: facebook.com/share/r/VIDEO_ID
      const shareRMatch = url.match(/\/share\/r\/([a-zA-Z0-9_-]+)/);
      if (shareRMatch && shareRMatch[1]) {
        return shareRMatch[1];
      }

      // Pattern 4: facebook.com/share/v/VIDEO_ID
      const shareVMatch = url.match(/\/share\/v\/([a-zA-Z0-9_-]+)/);
      if (shareVMatch && shareVMatch[1]) {
        return shareVMatch[1];
      }

      // Pattern 5: facebook.com/share/VIDEO_ID (direct share)
      const shareMatch = url.match(/\/share\/([a-zA-Z0-9_-]+)(?:\/|\?|$)/);
      if (shareMatch && shareMatch[1]) {
        return shareMatch[1];
      }

      // Pattern 6: facebook.com/reel/VIDEO_ID
      const reelMatch = url.match(/\/reel\/([a-zA-Z0-9_-]+)/);
      if (reelMatch && reelMatch[1]) {
        return reelMatch[1];
      }

      // Pattern 7: fb.watch/VIDEO_ID
      const fbWatchMatch = url.match(/fb\.watch\/([a-zA-Z0-9_-]+)/);
      if (fbWatchMatch && fbWatchMatch[1]) {
        return fbWatchMatch[1];
      }

      // If no pattern matched, return null (will use mock service)
      return null;
    } catch {
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