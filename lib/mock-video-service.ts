/**
 * Mock Video Extraction Service
 * Simulates Facebook video extraction with realistic data
 */

import { VideoMetadata, VideoQuality } from "./types";

/**
 * Mock video database with realistic Facebook video data
 */
const MOCK_VIDEOS: Record<string, VideoMetadata> = {
  video_001: {
    id: "video_001",
    title: "Amazing Nature Documentary - 4K Ultra HD",
    duration: 1245,
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    url: "https://www.facebook.com/watch/?v=video_001",
    fileSize: {
      "720p": 125 * 1024 * 1024,
      "480p": 65 * 1024 * 1024,
      "360p": 35 * 1024 * 1024,
    },
  },
  video_002: {
    id: "video_002",
    title: "Funny Cat Videos Compilation - Best Moments",
    duration: 456,
    thumbnail: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=300&fit=crop",
    url: "https://www.facebook.com/watch/?v=video_002",
    fileSize: {
      "720p": 95 * 1024 * 1024,
      "480p": 52 * 1024 * 1024,
      "360p": 28 * 1024 * 1024,
    },
  },
  video_003: {
    id: "video_003",
    title: "Travel Vlog: Exploring Tokyo Streets",
    duration: 892,
    thumbnail: "https://images.unsplash.com/photo-1552832860-cfaf6899ef14?w=400&h=300&fit=crop",
    url: "https://www.facebook.com/watch/?v=video_003",
    fileSize: {
      "720p": 145 * 1024 * 1024,
      "480p": 78 * 1024 * 1024,
      "360p": 42 * 1024 * 1024,
    },
  },
};

/**
 * Alternative thumbnail sources for variety
 */
const ALTERNATIVE_THUMBNAILS = [
  "https://images.unsplash.com/photo-1611339555312-e607c90352fd?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop",
];

/**
 * Sample video titles for variety
 */
const SAMPLE_TITLES = [
  "Incredible Moments Caught on Camera",
  "Behind the Scenes Exclusive",
  "Top 10 Most Viewed Videos",
  "Live Performance - Full Concert",
  "Documentary: The Story Behind",
];

export class MockVideoService {
  private static instance: MockVideoService;

  private constructor( ) {}

  static getInstance(): MockVideoService {
    if (!MockVideoService.instance) {
      MockVideoService.instance = new MockVideoService();
    }
    return MockVideoService.instance;
  }

  /**
   * Extract video metadata from URL (mock implementation)
   */
  async extractVideoMetadata(url: string): Promise<VideoMetadata | null> {
    try {
      await this.delay(1000);

      const videoId = this.extractVideoId(url);
      if (!videoId) {
        return null;
      }

      if (MOCK_VIDEOS[videoId]) {
        return MOCK_VIDEOS[videoId];
      }

      return this.generateMockVideo(videoId, url);
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate random mock video data
   */
  private generateMockVideo(videoId: string, url: string): VideoMetadata {
    const randomTitle = SAMPLE_TITLES[Math.floor(Math.random() * SAMPLE_TITLES.length)];
    const randomThumbnail = ALTERNATIVE_THUMBNAILS[Math.floor(Math.random() * ALTERNATIVE_THUMBNAILS.length)];
    const randomDuration = Math.floor(Math.random() * 1800) + 120;

    const baseSizeMultiplier = randomDuration / 60;
    const size720p = Math.round(baseSizeMultiplier * 100) * 1024 * 1024;
    const size480p = Math.round(baseSizeMultiplier * 55) * 1024 * 1024;
    const size360p = Math.round(baseSizeMultiplier * 30) * 1024 * 1024;

    return {
      id: videoId,
      title: randomTitle,
      duration: randomDuration,
      thumbnail: randomThumbnail,
      url: url,
      fileSize: {
        "720p": size720p,
        "480p": size480p,
        "360p": size360p,
      },
    };
  }

  /**
   * Get all available resolutions for a video
   */
  getAvailableResolutions(videoId: string): string[] {
    const video = MOCK_VIDEOS[videoId];
    if (!video || !video.fileSize) {
      return ["720p", "480p", "360p"];
    }
    const keys = Object.keys(video.fileSize);
    return keys.length > 0 ? (keys as VideoQuality[]) : ["720p", "480p", "360p"];
  }

  /**
   * Format duration to readable string
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  /**
   * Format file size to readable string
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
  }

  /**
   * Extract video ID from Facebook URL
   */
  private extractVideoId(url: string): string | null {
    try {
      const patterns = [
        /v=([a-zA-Z0-9_-]+)/,
        /\/video\.php\?v=([a-zA-Z0-9_-]+)/,
        /\/watch\/([a-zA-Z0-9_-]+)/,
        /\/watch\?v=([a-zA-Z0-9_-]+)/,
        /\/reel\/([a-zA-Z0-9_-]+)/,
        /\/share\/r\/([a-zA-Z0-9_-]+)/,
        /\/share\/v\/([a-zA-Z0-9_-]+)/,
        /\/share\/([a-zA-Z0-9_-]+)(?:\/|\?|$)/,
        /fb\.watch\/([a-zA-Z0-9_-]+)/,
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
   * Simulate network delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Validate if URL is a Facebook video URL
   */
  isValidFacebookUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes("facebook.com") || urlObj.hostname.includes("fb.com");
    } catch {
      return false;
    }
  }

  /**
   * Get quality label with description
   */
  getQualityLabel(resolution: string): { label: string; description: string } {
    const labels: Record<string, { label: string; description: string }> = {
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
   * Get mock video by ID (for testing)
   */
  getMockVideoById(videoId: string): VideoMetadata | undefined {
    return MOCK_VIDEOS[videoId];
  }

  /**
   * Get all mock videos (for testing)
   */
  getAllMockVideos(): Record<string, VideoMetadata> {
    return MOCK_VIDEOS;
  }
}

export default MockVideoService;
