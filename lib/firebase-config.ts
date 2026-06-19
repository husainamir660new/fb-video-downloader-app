/**
 * Firebase Configuration and Initialization
 * Handles Analytics, Crash Reporting, and Performance Monitoring
 * Firebase is optional - app works without it
 */

import { Platform } from "react-native";

/**
 * Firebase Configuration
 * Replace with your actual Firebase project credentials from Firebase Console
 * Get these from: https://console.firebase.google.com/project/YOUR_PROJECT/settings/general
 */
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDemoKeyForDevelopment",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "fb-video-downloader.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "fb-video-downloader",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "fb-video-downloader.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX",
};

// Firebase initialization - gracefully handles missing SDK
let isFirebaseAvailable = false;
let app: any;
let analytics: any;
let performance: any;

try {
  // Try to import Firebase modules
  const firebase = require("firebase/app");
  const analyticsModule = require("firebase/analytics");
  const performanceModule = require("firebase/performance");

  if (firebase && firebase.initializeApp) {
    app = firebase.initializeApp(firebaseConfig);
    isFirebaseAvailable = true;

    // Initialize Analytics
    if (analyticsModule && analyticsModule.getAnalytics) {
      analytics = analyticsModule.getAnalytics(app);
    }

    // Initialize Performance Monitoring
    if (performanceModule && performanceModule.getPerformance) {
      performance = performanceModule.getPerformance(app);
    }

    console.log("Firebase initialized successfully");
  }
} catch (error) {
  console.warn("Firebase SDK not available - analytics disabled. This is normal during development.");
  isFirebaseAvailable = false;
}

/**
 * Firebase Analytics Service
 * Tracks user events, crashes, and performance metrics
 * Gracefully handles Firebase unavailability
 */
export class FirebaseAnalyticsService {
  private static instance: FirebaseAnalyticsService;

  private constructor() {}

  static getInstance(): FirebaseAnalyticsService {
    if (!FirebaseAnalyticsService.instance) {
      FirebaseAnalyticsService.instance = new FirebaseAnalyticsService();
    }
    return FirebaseAnalyticsService.instance;
  }

  /**
   * Set user ID for tracking user-specific events
   */
  setUserId(userId: string): void {
    if (!isFirebaseAvailable || !analytics) return;
    try {
      const { setUserId } = require("firebase/analytics");
      setUserId(analytics, userId);
    } catch (error) {
      console.warn("Error setting user ID:", error);
    }
  }

  /**
   * Set user properties for segmentation
   */
  setUserProperties(properties: Record<string, string | number | boolean>): void {
    if (!isFirebaseAvailable || !analytics) return;
    try {
      const { setUserProperties } = require("firebase/analytics");
      setUserProperties(analytics, properties);
    } catch (error) {
      console.warn("Error setting user properties:", error);
    }
  }

  /**
   * Track app open event
   */
  trackAppOpen(): void {
    if (!isFirebaseAvailable || !analytics) return;
    try {
      const { logEvent } = require("firebase/analytics");
      logEvent(analytics, "app_open", {
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
      });
    } catch (error) {
      console.warn("Error tracking app open:", error);
    }
  }

  /**
   * Track video download event
   */
  trackVideoDownload(data: {
    videoId: string;
    quality: string;
    fileSize: number;
    duration: number;
    source?: string;
  }): void {
    if (!isFirebaseAvailable || !analytics) return;
    try {
      const { logEvent } = require("firebase/analytics");
      logEvent(analytics, "video_download", {
        video_id: data.videoId,
        quality: data.quality,
        file_size_mb: Math.round((data.fileSize / 1024 / 1024) * 100) / 100,
        duration_seconds: data.duration,
        source: data.source || "unknown",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Error tracking video download:", error);
    }
  }

  /**
   * Track download error
   */
  trackDownloadError(data: {
    videoId: string;
    quality: string;
    errorMessage: string;
    errorCode?: string;
  }): void {
    if (!isFirebaseAvailable || !analytics) return;
    try {
      const { logEvent } = require("firebase/analytics");
      logEvent(analytics, "download_error", {
        video_id: data.videoId,
        quality: data.quality,
        error_message: data.errorMessage,
        error_code: data.errorCode || "unknown",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Error tracking download error:", error);
    }
  }

  /**
   * Track premium conversion
   */
  trackPremiumConversion(data: {
    userId: string;
    plan: "monthly" | "yearly";
    price: number;
    currency: string;
  }): void {
    if (!isFirebaseAvailable || !analytics) return;
    try {
      const { logEvent } = require("firebase/analytics");
      logEvent(analytics, "premium_purchase", {
        user_id: data.userId,
        plan: data.plan,
        price: data.price,
        currency: data.currency,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Error tracking premium conversion:", error);
    }
  }

  /**
   * Track ad impression
   */
  trackAdImpression(data: {
    adType: "banner" | "interstitial" | "rewarded";
    adNetwork: string;
    placement: string;
  }): void {
    if (!isFirebaseAvailable || !analytics) return;
    try {
      const { logEvent } = require("firebase/analytics");
      logEvent(analytics, "ad_impression", {
        ad_type: data.adType,
        ad_network: data.adNetwork,
        placement: data.placement,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Error tracking ad impression:", error);
    }
  }

  /**
   * Track ad click
   */
  trackAdClick(data: {
    adType: "banner" | "interstitial" | "rewarded";
    adNetwork: string;
    placement: string;
  }): void {
    if (!isFirebaseAvailable || !analytics) return;
    try {
      const { logEvent } = require("firebase/analytics");
      logEvent(analytics, "ad_click", {
        ad_type: data.adType,
        ad_network: data.adNetwork,
        placement: data.placement,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Error tracking ad click:", error);
    }
  }

  /**
   * Track rewarded ad completion
   */
  trackRewardedAdComplete(data: {
    adNetwork: string;
    rewardType: string;
    rewardValue: number;
  }): void {
    if (!isFirebaseAvailable || !analytics) return;
    try {
      const { logEvent } = require("firebase/analytics");
      logEvent(analytics, "rewarded_ad_complete", {
        ad_network: data.adNetwork,
        reward_type: data.rewardType,
        reward_value: data.rewardValue,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Error tracking rewarded ad completion:", error);
    }
  }

  /**
   * Track referral share
   */
  trackReferralShare(data: {
    userId: string;
    referralCode: string;
    shareMethod: string;
  }): void {
    if (!isFirebaseAvailable || !analytics) return;
    try {
      const { logEvent } = require("firebase/analytics");
      logEvent(analytics, "referral_share", {
        user_id: data.userId,
        referral_code: data.referralCode,
        share_method: data.shareMethod,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Error tracking referral share:", error);
    }
  }

  /**
   * Track screen view
   */
  trackScreenView(screenName: string, screenClass?: string): void {
    if (!isFirebaseAvailable || !analytics) return;
    try {
      const { logEvent } = require("firebase/analytics");
      logEvent(analytics, "screen_view", {
        screen_name: screenName,
        screen_class: screenClass || screenName,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Error tracking screen view:", error);
    }
  }

  /**
   * Track user engagement
   */
  trackUserEngagement(data: {
    engagementType: string;
    duration: number;
    metadata?: Record<string, any>;
  }): void {
    if (!isFirebaseAvailable || !analytics) return;
    try {
      const { logEvent } = require("firebase/analytics");
      logEvent(analytics, "user_engagement", {
        engagement_type: data.engagementType,
        duration_seconds: data.duration,
        ...data.metadata,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Error tracking user engagement:", error);
    }
  }

  /**
   * Track app crash (manual)
   */
  trackCrash(error: Error): void {
    if (!isFirebaseAvailable || !analytics) return;
    try {
      const { logEvent } = require("firebase/analytics");
      logEvent(analytics, "app_crash", {
        error_message: error.message,
        error_stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Error tracking crash:", err);
    }
  }

  /**
   * Track custom event
   */
  trackCustomEvent(eventName: string, eventData?: Record<string, any>): void {
    if (!isFirebaseAvailable || !analytics) return;
    try {
      const { logEvent } = require("firebase/analytics");
      logEvent(analytics, eventName, {
        ...eventData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Error tracking custom event:", error);
    }
  }
}

export const firebaseAnalytics = FirebaseAnalyticsService.getInstance();
