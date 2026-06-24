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
  // ✅ درست: اگر env var نبود، Render URL استفاده می‌شود


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
          source: "real",
        };
      }

      // Extract video ID
      const videoId = this.extractVideoId(url);
      if (!videoId) {
        return {
          success: false,
          error: "Could not extract video ID from URL",
          source: "real",
        };
      }

      // Try real API first
      if (this.backendApiUrl) {
        try {
          const response = await fetch(`${this.backendApiUrl}/api/trpc/facebookDownloader.extractVideo`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url,
              videoId,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            return {
              success: true,
              data: data.result?.data,
              source: "real",
            };
          }
        } catch (error) {
          console.warn("Real API failed, falling back to mock service", error);
        }
      }

      // Fallback to mock service
      const mockData = await this.mockService.extractVideoMetadata(videoId);
      if (mockData && mockData !== null) {
        return {
          success: true,
          data: mockData,
          source: "mock",
        };
      }

      return {
        success: false,
        error: "Could not extract video metadata",
        source: "mock",
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: errorMessage,
        source: "real",
      };
    }
  }

  /**
   * Get available video qualities for a given resolution
   */
  getQualityInfo(resolution: string): { label: string; description: string } {
    const labels: Record<string, { label: string; description: string }> = {
      "1080p": {
        label: "Full HD",
        description: "Full High Definition - Best quality",
      },
      "720p": {
        label: "HD",
        description: "High Definition - Best for most devices",
      },
      "480p": {
        label: "SD",
        description: "Standard Definition - Balanced quality & size",
      },
      "360p": {
        label: "Low",
        description: "Low Quality - Smallest file size",
      },
    };
    return labels[resolution] || { label: resolution, description: "Unknown quality" };
  }

  /**
   * Validate if URL is a Facebook video URL
   */
  private isValidFacebookUrl(url: string): boolean {
    const facebookUrlPatterns = [
      /facebook\.com\/watch/,
      /facebook\.com\/.*\/videos/,
      /facebook\.com\/share\/r\//,
      /facebook\.com\/share\/v\//,
      /facebook\.com\/share\/[a-zA-Z0-9_\-]+/,
      /facebook\.com\/reel\/[a-zA-Z0-9_\-]+/,
      /fb\.watch/,
      /m\.facebook\.com\/watch/,
      /m\.facebook\.com\/share/,
    ];
    return facebookUrlPatterns.some((pattern) => pattern.test(url));
  }

  /**
   * Extract video ID from Facebook URL
   * Supports multiple URL formats
   */
  private extractVideoId(url: string): string | null {
    // watch?v=ID format
    const watchMatch = url.match(/[?&]v=([0-9]+)/);
    if (watchMatch?.[1]) {
      return watchMatch[1];
    }

    // /videos/ID format
    const videosMatch = url.match(/\/videos\/([0-9]+)/);
    if (videosMatch?.[1]) {
      return videosMatch[1];
    }

    // fb.watch/ID format
    const fbWatchMatch = url.match(/fb\.watch\/([a-zA-Z0-9_\-]+)/);
    if (fbWatchMatch?.[1]) {
      return fbWatchMatch[1];
    }

    // /reel/ID format
    const reelMatch = url.match(/\/reel\/([a-zA-Z0-9_\-]+)/);
    if (reelMatch?.[1]) {
      return reelMatch[1];
    }

    // /share/r/ID format
    const shareRMatch = url.match(/\/share\/r\/([a-zA-Z0-9_\-]+)\/?$/);
    if (shareRMatch?.[1]) {
      return shareRMatch[1];
    }

    // /share/v/ID format
    const shareVMatch = url.match(/\/share\/v\/([a-zA-Z0-9_\-]+)\/?$/);
    if (shareVMatch?.[1]) {
      return shareVMatch[1];
    }

    // Direct share link: /share/ID format (most flexible)
    const directShareMatch = url.match(/\/share\/([a-zA-Z0-9_\-]+)\/?$/);
    if (directShareMatch?.[1]) {
      return directShareMatch[1];
    }

    return null;
  }

  /**
   * Get mock video by ID (for testing)
   */
  getMockVideoById(videoId: string): VideoMetadata | undefined {
    return this.mockService.getMockVideoById(videoId);
  }

  /**
   * Get all mock videos (for testing)
   */
  getAllMockVideos(): Record<string, VideoMetadata> {
    return this.mockService.getAllMockVideos();
  }
}

export default RealVideoExtractionService;
