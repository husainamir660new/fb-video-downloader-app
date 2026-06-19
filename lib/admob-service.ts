/**
 * AdMob Service - Integration with Google Mobile Ads SDK
 * Handles banner, interstitial, and rewarded ads
 */

import { Platform } from "react-native";

// AdMob Ad Unit IDs (replace with your actual IDs)
// Test IDs for development
const AD_UNIT_IDS = {
  // Banner ads
  banner: Platform.select({
    ios: "ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx", // Replace with your iOS banner ad unit ID
    android: "ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx", // Replace with your Android banner ad unit ID
  }),

  // Interstitial ads
  interstitial: Platform.select({
    ios: "ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx", // Replace with your iOS interstitial ad unit ID
    android: "ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx", // Replace with your Android interstitial ad unit ID
  }),

  // Rewarded ads
  rewarded: Platform.select({
    ios: "ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx", // Replace with your iOS rewarded ad unit ID
    android: "ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx", // Replace with your Android rewarded ad unit ID
  }),
};

// Test Ad Unit IDs (for development only)
export const TEST_AD_UNIT_IDS = {
  banner: Platform.select({
    ios: "ca-app-pub-3940256099942544/2934735945",
    android: "ca-app-pub-3940256099942544/6300978111",
  }),
  interstitial: Platform.select({
    ios: "ca-app-pub-3940256099942544/4411468910",
    android: "ca-app-pub-3940256099942544/1033173712",
  }),
  rewarded: Platform.select({
    ios: "ca-app-pub-3940256099942544/5224354917",
    android: "ca-app-pub-3940256099942544/5224354917",
  }),
};

export interface AdMobConfig {
  useTestAds: boolean;
  enableLogging: boolean;
}

export class AdMobService {
  private static instance: AdMobService;
  private config: AdMobConfig;
  private bannerAdUnitId: string;
  private interstitialAdUnitId: string;
  private rewardedAdUnitId: string;

  private constructor(config: AdMobConfig) {
    this.config = config;

    // Select ad unit IDs based on test mode
    const adUnitIds = config.useTestAds ? TEST_AD_UNIT_IDS : AD_UNIT_IDS;
    this.bannerAdUnitId = adUnitIds.banner || "";
    this.interstitialAdUnitId = adUnitIds.interstitial || "";
    this.rewardedAdUnitId = adUnitIds.rewarded || "";

    if (config.enableLogging) {
      console.log("[AdMob] Service initialized", {
        useTestAds: config.useTestAds,
        bannerAdUnitId: this.bannerAdUnitId,
      });
    }
  }

  static getInstance(config: AdMobConfig = { useTestAds: true, enableLogging: false }): AdMobService {
    if (!AdMobService.instance) {
      AdMobService.instance = new AdMobService(config);
    }
    return AdMobService.instance;
  }

  /**
   * Get banner ad unit ID
   */
  getBannerAdUnitId(): string {
    return this.bannerAdUnitId;
  }

  /**
   * Get interstitial ad unit ID
   */
  getInterstitialAdUnitId(): string {
    return this.interstitialAdUnitId;
  }

  /**
   * Get rewarded ad unit ID
   */
  getRewardedAdUnitId(): string {
    return this.rewardedAdUnitId;
  }

  /**
   * Show banner ad
   * TODO: Implement with google-mobile-ads-sdk
   */
  async showBannerAd(): Promise<void> {
    try {
      if (this.config.enableLogging) {
        console.log("[AdMob] Showing banner ad");
      }
      // Implementation will use google-mobile-ads-sdk
    } catch (error) {
      console.error("[AdMob] Error showing banner ad:", error);
    }
  }

  /**
   * Show interstitial ad
   * TODO: Implement with google-mobile-ads-sdk
   */
  async showInterstitialAd(): Promise<boolean> {
    try {
      if (this.config.enableLogging) {
        console.log("[AdMob] Showing interstitial ad");
      }
      // Implementation will use google-mobile-ads-sdk
      // Return true if ad was shown, false if failed
      return true;
    } catch (error) {
      console.error("[AdMob] Error showing interstitial ad:", error);
      return false;
    }
  }

  /**
   * Show rewarded ad
   * TODO: Implement with google-mobile-ads-sdk
   */
  async showRewardedAd(): Promise<boolean> {
    try {
      if (this.config.enableLogging) {
        console.log("[AdMob] Showing rewarded ad");
      }
      // Implementation will use google-mobile-ads-sdk
      // Return true if user watched the ad and earned reward
      return true;
    } catch (error) {
      console.error("[AdMob] Error showing rewarded ad:", error);
      return false;
    }
  }

  /**
   * Track ad impression
   */
  trackAdImpression(adType: "banner" | "interstitial" | "rewarded"): void {
    if (this.config.enableLogging) {
      console.log("[AdMob] Ad impression tracked:", adType);
    }
    // TODO: Send to Firebase Analytics
  }

  /**
   * Track ad click
   */
  trackAdClick(adType: "banner" | "interstitial" | "rewarded"): void {
    if (this.config.enableLogging) {
      console.log("[AdMob] Ad click tracked:", adType);
    }
    // TODO: Send to Firebase Analytics
  }
}

export default AdMobService;
