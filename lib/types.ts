/**
 * Core types for FB Video Downloader app
 */

export type VideoQuality = "720p" | "480p" | "360p";

export interface VideoMetadata {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  url: string;

  fileSize?: Record<VideoQuality, number>;

  resolution?: Record<VideoQuality, VideoResolution>;
}

export interface DownloadedVideo {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  quality: VideoQuality;
  fileSize: number;
  filePath: string;
  downloadedAt: string; // ISO timestamp
  url: string;
}

export interface DownloadProgress {
  videoId: string;
  progress: number; // 0-100
  downloadedBytes: number;
  totalBytes: number;
  speed: number; // bytes per second
  eta: number; // seconds remaining
  status: "idle" | "downloading" | "completed" | "failed";
  error?: string;
}

export interface UserPreferences {
  theme: "light" | "dark" | "auto";
  notificationsEnabled: boolean;
  autoDownloadQuality: VideoQuality;
  referralCode: string;
  premiumStatus: "free" | "premium";
  premiumExpiresAt?: number; // timestamp
}

export interface ReferralData {
  referralCode?: string;
  friendsInvited?: number;
  premiumDaysEarned?: number;

  code: string;
  invitesSent: number;
  invitesAccepted: number;
  rewardsEarned: number;
}

export interface VideoResolution {
  width: number;
  height: number;
  bitrate: string;
  fileSize?: number;
}
