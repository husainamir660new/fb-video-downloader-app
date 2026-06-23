/**
 * Storage utilities for AsyncStorage persistence
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DownloadedVideo,
  UserPreferences,
  ReferralData,
  VideoQuality,
} from "./types";

const STORAGE_KEYS = {
  DOWNLOAD_HISTORY: "fb_downloader_history",
  USER_PREFERENCES: "fb_downloader_preferences",
  REFERRAL_DATA: "fb_downloader_referral",
};

// Download History
export async function saveDownloadedVideo(video: DownloadedVideo) {
  try {
    const history = await getDownloadHistory();
    history.unshift(video); // Add to beginning (newest first)
    await AsyncStorage.setItem(
      STORAGE_KEYS.DOWNLOAD_HISTORY,
      JSON.stringify(history)
    );
  } catch (error) {
    // Silently fail - video not saved
  }
}

export async function getDownloadHistory(): Promise<DownloadedVideo[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOAD_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
}

export async function deleteDownloadedVideo(id: string) {
  try {
    const history = await getDownloadHistory();
    const filtered = history.filter((v) => v.id !== id);
    await AsyncStorage.setItem(
      STORAGE_KEYS.DOWNLOAD_HISTORY,
      JSON.stringify(filtered)
    );
  } catch (error) {
    // Silently fail - video not deleted
  }
}

export async function clearDownloadHistory() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.DOWNLOAD_HISTORY);
  } catch (error) {
    // Silently fail - history not cleared
  }
}

// User Preferences
export async function saveUserPreferences(prefs: UserPreferences) {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_PREFERENCES,
      JSON.stringify(prefs)
    );
  } catch (error) {
    // Silently fail - preferences not saved
  }
}

export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    if (data) {
      return JSON.parse(data);
    }
    // Return default preferences
    return {
      theme: "auto",
      notificationsEnabled: true,
      autoDownloadQuality: "480p",
      referralCode: generateReferralCode(),
      premiumStatus: "free",
    };
  } catch (error) {
    return {
      theme: "auto",
      notificationsEnabled: true,
      autoDownloadQuality: "480p",
      referralCode: generateReferralCode(),
      premiumStatus: "free",
    };
  }
}

export async function updateUserPreferences(
  updates: Partial<UserPreferences>
) {
  try {
    const current = await getUserPreferences();
    const updated = { ...current, ...updates };
    await saveUserPreferences(updated);
  } catch (error) {
    // Silently fail - preferences not updated
  }
}

// Referral Data
function hydrateReferralData(
  raw: Partial<ReferralData>,
  fallbackCode: string,
): ReferralData {
  const code = raw.code ?? raw.referralCode ?? fallbackCode;
  const invitesSent = raw.invitesSent ?? raw.friendsInvited ?? 0;
  const invitesAccepted = raw.invitesAccepted ?? 0;
  const rewardsEarned = raw.rewardsEarned ?? raw.premiumDaysEarned ?? 0;
  return {
    code,
    invitesSent,
    invitesAccepted,
    rewardsEarned,
    referralCode: code,
    friendsInvited: invitesSent,
    premiumDaysEarned: rewardsEarned,
  };
}

export async function getReferralData(): Promise<ReferralData> {
  try {
    const prefs = await getUserPreferences();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.REFERRAL_DATA);
    if (data) {
      return hydrateReferralData(JSON.parse(data), prefs.referralCode);
    }
    return hydrateReferralData({}, prefs.referralCode);
  } catch (error) {
    const prefs = await getUserPreferences();
    return hydrateReferralData({}, prefs.referralCode);
  }
}

export async function updateReferralData(updates: Partial<ReferralData>) {
  try {
    const current = await getReferralData();
    const updated = { ...current, ...updates };
    await AsyncStorage.setItem(
      STORAGE_KEYS.REFERRAL_DATA,
      JSON.stringify(updated)
    );
  } catch (error) {
    // Silently fail - referral data not updated
  }
}

// Utility functions
function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Advanced Facebook URL validation using comprehensive parser
 */
export function validateFacebookUrl(url: string): boolean {
  try {
    // Use the advanced parser from facebook-url-parser
    const FACEBOOK_URL_PATTERNS = [
      /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/video\.php\?v=(\d+)/i,
      /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/watch\/?\?v=(\d+)/i,
      /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/reel\/(\d+)/i,
      /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/share\/r\/([a-zA-Z0-9]+)/i,
      /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/share\/v\/([a-zA-Z0-9]+)/i,
      /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/(?:[a-zA-Z0-9._-]+)\/videos\/(\d+)/i,
      /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/(?:[a-zA-Z0-9._-]+)\/posts\/(\d+)/i,
      /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/permalink\.php\?story_fbid=(\d+)/i,
      /(?:https?:\/\/ )?m\.(?:facebook|fb)\.com\/video\.php\?v=(\d+)/i,
      /(?:https?:\/\/ )?m\.(?:facebook|fb)\.com\/watch\/?\?v=(\d+)/i,
      /(?:https?:\/\/ )?m\.(?:facebook|fb)\.com\/reel\/(\d+)/i,
      /(?:https?:\/\/ )?m\.(?:facebook|fb)\.com\/share\/r\/([a-zA-Z0-9]+)/i,
      /(?:https?:\/\/ )?fb\.watch\/([a-zA-Z0-9]+)\/?/i,
      /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/stories\/(\d+)/i,
    ];

    const trimmedUrl = url.trim();
    return FACEBOOK_URL_PATTERNS.some((pattern) => pattern.test(trimmedUrl));
  } catch {
    return false;
  }
}

/**
 * Extract video ID from Facebook URL using comprehensive patterns
 * Supports all modern Facebook URL formats including /share/r/, /reels/, mobile shares, etc.
 */
export function extractVideoId(url: string): string | null {
  try {
    const trimmedUrl = url.trim();

    // Comprehensive regex patterns for all Facebook URL formats
    const patterns = [
      // Standard video.php format
      { regex: /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/video\.php\?v=(\d+)/i, index: 1 },
      // Watch format
      { regex: /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/watch\/?\?v=(\d+)/i, index: 1 },
      // Reel format
      { regex: /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/reel\/(\d+)/i, index: 1 },
      // Share/r format (Mobile shares) - CRITICAL FIX
      { regex: /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/share\/r\/([a-zA-Z0-9_-]+)/i, index: 1 },
      // Share/v format
      { regex: /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/share\/v\/([a-zA-Z0-9_-]+)/i, index: 1 },
      // Profile/user video format
      { regex: /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/(?:[a-zA-Z0-9._-]+)\/videos\/(\d+)/i, index: 1 },
      // Page post format
      { regex: /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/(?:[a-zA-Z0-9._-]+)\/posts\/(\d+)/i, index: 1 },
      // Permalink format
      { regex: /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/permalink\.php\?story_fbid=(\d+)/i, index: 1 },
      // Mobile m.facebook.com video.php
      { regex: /(?:https?:\/\/ )?m\.(?:facebook|fb)\.com\/video\.php\?v=(\d+)/i, index: 1 },
      // Mobile m.facebook.com watch
      { regex: /(?:https?:\/\/ )?m\.(?:facebook|fb)\.com\/watch\/?\?v=(\d+)/i, index: 1 },
      // Mobile m.facebook.com reel
      { regex: /(?:https?:\/\/ )?m\.(?:facebook|fb)\.com\/reel\/(\d+)/i, index: 1 },
      // Mobile m.facebook.com share/r - CRITICAL FIX
      { regex: /(?:https?:\/\/ )?m\.(?:facebook|fb)\.com\/share\/r\/([a-zA-Z0-9_-]+)/i, index: 1 },
      // Short URL format
      { regex: /(?:https?:\/\/ )?fb\.watch\/([a-zA-Z0-9_-]+)\/?/i, index: 1 },
      // Story format
      { regex: /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/stories\/(\d+)/i, index: 1 },
      // Video with query params
      { regex: /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/video\.php\?v=(\d+)(?:&.*)?/i, index: 1 },
      // Watch with query params
      { regex: /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/watch\/?\?v=(\d+)(?:&.*)?/i, index: 1 },
    ];

    // Try each pattern
    for (const { regex, index } of patterns) {
      const match = trimmedUrl.match(regex);
      if (match && match[index]) {
        return match[index];
      }
    }

    return null;
  } catch (error) {
    console.error("Error extracting video ID:", error);
    return null;
  }
}
