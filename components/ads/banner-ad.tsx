import React, { useState, useEffect } from "react";
import { View, Platform } from "react-native";

/**
 * Banner Ad Component
 * Displays a banner ad at the bottom of screens (Android/iOS only)
 * 
 * Ad Unit IDs:
 * - Android: ca-app-pub-6519568646843371/5241905732
 * - iOS: ca-app-pub-6519568646843371/5241905732
 * 
 * Improved error handling:
 * - Validates AdMob modules are installed
 * - Returns null if modules not available
 * - Prevents crashes on initialization
 */
export function BannerAdComponent() {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [BannerAd, setBannerAd] = useState<any>(null);
  const [BannerAdSize, setBannerAdSize] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Dynamically load AdMob only on native platforms
  useEffect(() => {
    // Skip on web
    if (Platform.OS !== "android" && Platform.OS !== "ios") {
      setIsInitialized(true);
      return;
    }

    try {
      const adMobModule = require("react-native-google-mobile-ads");
      
      // Validate modules exist before using
      if (!adMobModule?.BannerAd || !adMobModule?.BannerAdSize) {
        throw new Error("AdMob modules not properly installed");
      }

      setBannerAd(() => adMobModule.BannerAd);
      setBannerAdSize(() => adMobModule.BannerAdSize);
      setAdError(null);
      setIsInitialized(true);
      console.log("✅ AdMob BannerAd initialized successfully");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.warn("⚠️ AdMob BannerAd initialization failed:", errorMsg);
      setAdError(errorMsg);
      setBannerAd(null);
      setBannerAdSize(null);
      setIsInitialized(true);
    }
  }, []);

  // Don't render if not initialized, or if error, or if modules not loaded
  if (!isInitialized || adError || !BannerAd || !BannerAdSize) {
    return null;
  }

  // Get platform-specific ad unit ID
  const bannerAdUnitId = Platform.select({
    android: "ca-app-pub-6519568646843371/5241905732",
    ios: "ca-app-pub-6519568646843371/5241905732",
    default: "ca-app-pub-6519568646843371/5241905732",
  }) || "ca-app-pub-6519568646843371/5241905732";

  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 8 }}>
      <BannerAd
        unitId={bannerAdUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={() => {
          setAdLoaded(true);
          setAdError(null);
          console.log("✅ Banner ad loaded successfully");
        }}
        onAdFailedToLoad={(error: any) => {
          const errorMsg = error?.message || "Unknown error";
          console.warn("⚠️ Banner ad failed to load:", errorMsg);
          // Don't set error state - just log it
          // This prevents the component from disappearing
        }}
      />
    </View>
  );
}
