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
    console.error("Error saving downloaded video:", error);
  }
}

export async function getDownloadHistory(): Promise<DownloadedVideo[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOAD_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting download history:", error);
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
    console.error("Error deleting downloaded video:", error);
  }
}

export async function clearDownloadHistory() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.DOWNLOAD_HISTORY);
  } catch (error) {
    console.error("Error clearing download history:", error);
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
    console.error("Error saving user preferences:", error);
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
    console.error("Error getting user preferences:", error);
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
    console.error("Error updating user preferences:", error);
  }
}

// Referral Data
export async function getReferralData(): Promise<ReferralData> {
  try {
    const prefs = await getUserPreferences();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.REFERRAL_DATA);
    if (data) {
      return JSON.parse(data);
    }
    // Return default referral data
    return {
      code: prefs.referralCode,
      invitesSent: 0,
      invitesAccepted: 0,
      rewardsEarned: 0,
    };
  } catch (error) {
    console.error("Error getting referral data:", error);
    const prefs = await getUserPreferences();
    return {
      code: prefs.referralCode,
      invitesSent: 0,
      invitesAccepted: 0,
      rewardsEarned: 0,
    };
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
    console.error("Error updating referral data:", error);
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

export function validateFacebookUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname.includes("facebook.com") ||
      urlObj.hostname.includes("fb.watch")
    );
  } catch {
    return false;
  }
}

export function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const videoId = urlObj.searchParams.get("v");
    if (videoId) return videoId;

    // Try to extract from path
    const pathMatch = urlObj.pathname.match(/\/video\.php\?v=(\d+)/);
    if (pathMatch) return pathMatch[1];

    // Try fb.watch format
    const fbWatchMatch = urlObj.pathname.match(/\/(\w+)$/);
    if (fbWatchMatch) return fbWatchMatch[1];

    return null;
  } catch {
    return null;
  }
}
