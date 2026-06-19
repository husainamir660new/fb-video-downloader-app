/**
 * Mock Video Extraction Service
 * Simulates Facebook video extraction with realistic data
 */

import { VideoMetadata, VideoResolution, VideoQuality } from "./types";

/**
 * Mock video database with realistic Facebook video data
 */
const MOCK_VIDEOS: Record<string, VideoMetadata> = {
  "video_001": {
    id: "video_001",
    title: "Amazing Nature Documentary - 4K Ultra HD",
    duration: 1245, // seconds
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    url: "https://www.facebook.com/watch/?v=video_001",
    fileSize: {
      "720p": 125 * 1024 * 1024, // 125 MB
      "480p": 65 * 1024 * 1024, // 65 MB
      "360p": 35 * 1024 * 1024, // 35 MB
    },
    resolution: {
      "720p": { width: 1280, height: 720, bitrate: "5000k" },
      "480p": { width: 854, height: 480, bitrate: "2500k" },
      "360p": { width: 640, height: 360, bitrate: "1000k" },
    },
  },
  "video_002": {
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
    resolution: {
      "720p": { width: 1280, height: 720, bitrate: "4500k" },
      "480p": { width: 854, height: 480, bitrate: "2200k" },
      "360p": { width: 640, height: 360, bitrate: "900k" },
    },
  },
  "video_003": {
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
    resolution: {
      "720p": { width: 1280, height: 720, bitrate: "5200k" },
      "480p": { width: 854, height: 480, bitrate: "2700k" },
      "360p": { width: 640, height: 360, bitrate: "1100k" },
    },
  },
  "video_004": {
    id: "video_004",
    title: "Music Video - New Release 2024",
    duration: 234,
    thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=300&fit=crop",
    url: "https://www.facebook.com/watch/?v=video_004",
    fileSize: {
      "720p": 75 * 1024 * 1024,
      "480p": 42 * 1024 * 1024,
      "360p": 23 * 1024 * 1024,
    },
    resolution: {
      "720p": { width: 1280, height: 720, bitrate: "4000k" },
      "480p": { width: 854, height: 480, bitrate: "2000k" },
      "360p": { width: 640, height: 360, bitrate: "800k" },
    },
  },
  "video_005": {
    id: "video_005",
    title: "Gaming Highlights - Esports Tournament",
    duration: 1523,
    thumbnail: "https://images.unsplash.com/photo-1538481143235-b716cc223b67?w=400&h=300&fit=crop",
    url: "https://www.facebook.com/watch/?v=video_005",
    fileSize: {
      "720p": 165 * 1024 * 1024,
      "480p": 88 * 1024 * 1024,
      "360p": 48 * 1024 * 1024,
    },
    resolution: {
      "720p": { width: 1280, height: 720, bitrate: "5500k" },
      "480p": { width: 854, height: 480, bitrate: "2800k" },
      "360p": { width: 640, height: 360, bitrate: "1200k" },
    },
  },
  "video_006": {
    id: "video_006",
    title: "Cooking Show - Easy Recipes for Beginners",
    duration: 678,
    thumbnail: "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop",
    url: "https://www.facebook.com/watch/?v=video_006",
    fileSize: {
      "720p": 115 * 1024 * 1024,
      "480p": 62 * 1024 * 1024,
      "360p": 33 * 1024 * 1024,
    },
    resolution: {
      "720p": { width: 1280, height: 720, bitrate: "4800k" },
      "480p": { width: 854, height: 480, bitrate: "2400k" },
      "360p": { width: 640, height: 360, bitrate: "1000k" },
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
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop",
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
  "Tutorial: How to Master",
  "Reaction Video - Latest Release",
  "Unboxing: New Product Review",
  "Podcast Episode - Deep Dive",
  "Short Film - Award Winner",
];

export interface VideoResolution {
  width: number;
  height: number;
  bitrate: string;
}

export class MockVideoService {
  private static instance: MockVideoService;

  private constructor() {}

  static getInstance(): MockVideoService {
    if (!MockVideoService.instance) {
      MockVideoService.instance = new MockVideoService();
    }
    return MockVideoService.instance;
  }

  /**
   * Extract video metadata from URL (mock implementation)
   * In production, this would call an actual video extraction API
   */
  async extractVideoMetadata(url: string): Promise<VideoMetadata | null> {
    try {
      // Simulate network delay
      await this.delay(1000);

      // Extract video ID from URL
      const videoId = this.extractVideoId(url);
      if (!videoId) {
        return null;
      }

      // Check if we have mock data for this video
      if (MOCK_VIDEOS[videoId]) {
        return MOCK_VIDEOS[videoId];
      }

      // Generate random mock video data
      return this.generateMockVideo(videoId, url);
    } catch (error) {
      console.error("Error extracting video metadata:", error);
      return null;
    }
  }

  /**
   * Generate random mock video data
   */
  private generateMockVideo(videoId: string, url: string): VideoMetadata {
    const randomTitle = SAMPLE_TITLES[Math.floor(Math.random() * SAMPLE_TITLES.length)];
    const randomThumbnail = ALTERNATIVE_THUMBNAILS[Math.floor(Math.random() * ALTERNATIVE_THUMBNAILS.length)];
    const randomDuration = Math.floor(Math.random() * 1800) + 120; // 2-32 minutes

    // Generate file sizes based on duration
    const baseSizeMultiplier = randomDuration / 60; // MB per minute
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
      resolution: {
        "720p": { width: 1280, height: 720, bitrate: "5000k" },
        "480p": { width: 854, height: 480, bitrate: "2500k" },
        "360p": { width: 640, height: 360, bitrate: "1000k" },
      },
    };
  }

  /**
   * Get all available resolutions for a video
   */
  getAvailableResolutions(videoId: string): string[] {
    const video = MOCK_VIDEOS[videoId];
    if (!video) {
      return ["720p", "480p", "360p"];
    }
    return Object.keys(video.fileSize) as string[];
  }

  /**
   * Get resolution details
   */
  getResolutionDetails(videoId: string, resolution: string): VideoResolution | null {
    const video = MOCK_VIDEOS[videoId];
    if (!video) {
      return null;
    }
    // Mock resolution details based on quality
    const resolutions: Record<string, VideoResolution> = {
      "720p": { width: 1280, height: 720, bitrate: "5000k", fileSize: 250 * 1024 * 1024 },
      "480p": { width: 854, height: 480, bitrate: "2500k", fileSize: 125 * 1024 * 1024 },
      "360p": { width: 640, height: 360, bitrate: "1000k", fileSize: 50 * 1024 * 1024 },
    };
    return resolutions[resolution] || null;
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
   * Extract video ID from Facebook URL
   */
  private extractVideoId(url: string): string | null {
    try {
      // Handle various Facebook URL formats
      const patterns = [
        /v=(\d+)/,
        /\/video\.php\?v=(\d+)/,
        /\/watch\/(\d+)/,
        /\/watch\?v=(\d+)/,
        /\/(\w+)$/,
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
