/**
 * Firebase Analytics Service
 * Tracks user events, monetization metrics, and engagement
 */

export interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, string | number | boolean>;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private enableLogging: boolean;

  private constructor(enableLogging: boolean = false) {
    this.enableLogging = enableLogging;
  }

  static getInstance(enableLogging: boolean = false): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService(enableLogging);
    }
    return AnalyticsService.instance;
  }

  /**
   * Track app open
   */
  trackAppOpen(): void {
    this.logEvent({
      name: "app_open",
      parameters: {
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Track video download
   */
  trackVideoDownload(videoId: string, quality: string, fileSize: number): void {
    this.logEvent({
      name: "video_download",
      parameters: {
        video_id: videoId,
        quality: quality,
        file_size_mb: Math.round(fileSize / 1024 / 1024),
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Track download error
   */
  trackDownloadError(videoId: string, error: string): void {
    this.logEvent({
      name: "download_error",
      parameters: {
        video_id: videoId,
        error_message: error,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Track premium conversion
   */
  trackPremiumConversion(planId: string, price: number): void {
    this.logEvent({
      name: "premium_conversion",
      parameters: {
        plan_id: planId,
        price: price,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Track premium trial started
   */
  trackPremiumTrialStarted(planId: string): void {
    this.logEvent({
      name: "premium_trial_started",
      parameters: {
        plan_id: planId,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Track premium cancellation
   */
  trackPremiumCancellation(planId: string, reason?: string): void {
    this.logEvent({
      name: "premium_cancellation",
      parameters: {
        plan_id: planId,
        reason: reason || "unknown",
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Track ad impression
   */
  trackAdImpression(adType: "banner" | "interstitial" | "rewarded"): void {
    this.logEvent({
      name: "ad_impression",
      parameters: {
        ad_type: adType,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Track ad click
   */
  trackAdClick(adType: "banner" | "interstitial" | "rewarded"): void {
    this.logEvent({
      name: "ad_click",
      parameters: {
        ad_type: adType,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Track rewarded ad completion
   */
  trackRewardedAdCompletion(reward: string): void {
    this.logEvent({
      name: "rewarded_ad_completed",
      parameters: {
        reward: reward,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Track referral share
   */
  trackReferralShare(referralCode: string): void {
    this.logEvent({
      name: "referral_share",
      parameters: {
        referral_code: referralCode,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Track referral signup
   */
  trackReferralSignup(referralCode: string): void {
    this.logEvent({
      name: "referral_signup",
      parameters: {
        referral_code: referralCode,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Track screen view
   */
  trackScreenView(screenName: string): void {
    this.logEvent({
      name: "screen_view",
      parameters: {
        screen_name: screenName,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Track user engagement
   */
  trackEngagement(engagementType: string, duration: number): void {
    this.logEvent({
      name: "user_engagement",
      parameters: {
        engagement_type: engagementType,
        duration_seconds: duration,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Track theme change
   */
  trackThemeChange(theme: "light" | "dark" | "auto"): void {
    this.logEvent({
      name: "theme_changed",
      parameters: {
        theme: theme,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Track notification toggle
   */
  trackNotificationToggle(enabled: boolean): void {
    this.logEvent({
      name: "notification_toggle",
      parameters: {
        enabled: enabled,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Track custom event
   */
  trackCustomEvent(event: AnalyticsEvent): void {
    this.logEvent(event);
  }

  /**
   * Log event to Firebase Analytics
   * TODO: Replace with actual Firebase Analytics implementation
   */
  private logEvent(event: AnalyticsEvent): void {
    if (this.enableLogging) {
      console.log("[Analytics] Event tracked:", event.name, event.parameters);
    }

    // TODO: Send to Firebase Analytics
    // import { getAnalytics, logEvent } from "firebase/analytics";
    // const analytics = getAnalytics();
    // logEvent(analytics, event.name, event.parameters);
  }

  /**
   * Set user properties
   */
  setUserProperty(name: string, value: string): void {
    if (this.enableLogging) {
      console.log("[Analytics] User property set:", name, value);
    }

    // TODO: Send to Firebase Analytics
    // import { getAnalytics, setUserProperties } from "firebase/analytics";
    // const analytics = getAnalytics();
    // setUserProperties(analytics, { [name]: value });
  }

  /**
   * Set user ID
   */
  setUserId(userId: string): void {
    if (this.enableLogging) {
      console.log("[Analytics] User ID set:", userId);
    }

    // TODO: Send to Firebase Analytics
    // import { getAnalytics, setUserId } from "firebase/analytics";
    // const analytics = getAnalytics();
    // setUserId(analytics, userId);
  }
}

export default AnalyticsService;
