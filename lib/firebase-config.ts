/**
 * Firebase Analytics — Disabled on Native
 * ---------------------------------------------------------------------------
 * Firebase SDK is not compatible with React Native / Expo.
 * This file provides a no-op implementation to prevent crashes.
 * All analytics methods are safe no-ops on native platforms.
 * 
 * CRITICAL FIX: Added Platform.OS check to prevent Firebase initialization
 * on native Android/iOS. Firebase SDK tries to load native modules that don't
 * exist in React Native, causing immediate app crash on startup.
 */
import { Platform } from "react-native";

// Firebase is only available on web
const isWeb = Platform.OS === "web";

// Stub analytics object
let analytics: unknown = null;

// Only try to initialize Firebase on web
if (isWeb) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const firebase = require("firebase/app");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const analyticsModule = require("firebase/analytics");
    
    const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
    if (apiKey && firebase?.initializeApp) {
      const firebaseConfig = {
        apiKey,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
        measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
      };
      const app = firebase.initializeApp(firebaseConfig);
      if (analyticsModule?.getAnalytics) {
        analytics = analyticsModule.getAnalytics(app);
      }
    }
  } catch (e) {
    // Firebase SDK not available or initialization failed
    // All methods will be no-ops
    console.log("[Firebase] Analytics disabled (not available on this platform)");
  }
}

type EventPayload = Record<string, string | number | boolean | undefined>;

function safeLog(eventName: string, params: EventPayload): void {
  // No-op on native, only log on web if Firebase is available
  if (!isWeb || !analytics) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { logEvent } = require("firebase/analytics");
    logEvent(analytics, eventName, params);
  } catch {
    // Swallow analytics errors — they must never break the app.
  }
}

export class FirebaseAnalyticsService {
  private static instance: FirebaseAnalyticsService | null = null;

  static getInstance(): FirebaseAnalyticsService {
    if (!FirebaseAnalyticsService.instance) {
      FirebaseAnalyticsService.instance = new FirebaseAnalyticsService();
    }
    return FirebaseAnalyticsService.instance;
  }

  setUserId(userId: string): void {
    if (!isWeb || !analytics) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { setUserId } = require("firebase/analytics");
      setUserId(analytics, userId);
    } catch {
      /* no-op */
    }
  }

  setUserProperties(
    properties: Record<string, string | number | boolean>,
  ): void {
    if (!isWeb || !analytics) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { setUserProperties } = require("firebase/analytics");
      setUserProperties(analytics, properties);
    } catch {
      /* no-op */
    }
  }

  trackAppOpen(): void {
    safeLog("app_open", {
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
    });
  }

  trackVideoDownload(data: {
    videoId: string;
    quality: string;
    fileSize: number;
    duration: number;
    source?: string;
  }): void {
    safeLog("video_download", {
      video_id: data.videoId,
      quality: data.quality,
      file_size_mb: Math.round((data.fileSize / 1024 / 1024) * 100) / 100,
      duration_seconds: data.duration,
      source: data.source ?? "unknown",
      timestamp: new Date().toISOString(),
    });
  }

  trackDownloadError(data: {
    videoId: string;
    quality: string;
    errorMessage: string;
    errorCode?: string;
  }): void {
    safeLog("download_error", {
      video_id: data.videoId,
      quality: data.quality,
      error_message: data.errorMessage,
      error_code: data.errorCode ?? "unknown",
      timestamp: new Date().toISOString(),
    });
  }

  trackPremiumConversion(data: {
    userId: string;
    plan: "monthly" | "yearly";
    price: number;
    currency: string;
  }): void {
    safeLog("premium_purchase", {
      user_id: data.userId,
      plan: data.plan,
      price: data.price,
      currency: data.currency,
      timestamp: new Date().toISOString(),
    });
  }

  trackAdImpression(data: {
    adType: "banner" | "interstitial" | "rewarded";
    adNetwork: string;
    placement: string;
  }): void {
    safeLog("ad_impression", {
      ad_type: data.adType,
      ad_network: data.adNetwork,
      placement: data.placement,
      timestamp: new Date().toISOString(),
    });
  }

  trackAdClick(data: {
    adType: "banner" | "interstitial" | "rewarded";
    adNetwork: string;
    placement: string;
  }): void {
    safeLog("ad_click", {
      ad_type: data.adType,
      ad_network: data.adNetwork,
      placement: data.placement,
      timestamp: new Date().toISOString(),
    });
  }

  trackRewardedAdComplete(data: {
    adNetwork: string;
    rewardType: string;
    rewardValue: number;
  }): void {
    safeLog("rewarded_ad_complete", {
      ad_network: data.adNetwork,
      reward_type: data.rewardType,
      reward_value: data.rewardValue,
      timestamp: new Date().toISOString(),
    });
  }

  trackReferralShare(data: {
    userId: string;
    referralCode: string;
    shareMethod: string;
  }): void {
    safeLog("referral_share", {
      user_id: data.userId,
      referral_code: data.referralCode,
      share_method: data.shareMethod,
      timestamp: new Date().toISOString(),
    });
  }

  trackScreenView(screenName: string, screenClass?: string): void {
    safeLog("screen_view", {
      screen_name: screenName,
      screen_class: screenClass ?? screenName,
      timestamp: new Date().toISOString(),
    });
  }

  trackUserEngagement(data: {
    engagementType: string;
    duration: number;
    metadata?: Record<string, string | number | boolean>;
  }): void {
    safeLog("user_engagement", {
      engagement_type: data.engagementType,
      duration_seconds: data.duration,
      ...(data.metadata ?? {}),
      timestamp: new Date().toISOString(),
    });
  }

  trackCrash(error: Error): void {
    safeLog("app_crash", {
      error_message: error.message,
      error_stack: error.stack ?? "",
      timestamp: new Date().toISOString(),
    });
  }

  trackCustomEvent(
    eventName: string,
    eventData?: Record<string, string | number | boolean>,
  ): void {
    safeLog(eventName, {
      ...(eventData ?? {}),
      timestamp: new Date().toISOString(),
    });
  }
}

export const firebaseAnalytics = FirebaseAnalyticsService.getInstance();
