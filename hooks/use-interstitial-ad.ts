import { useCallback, useRef, useEffect, useState } from "react";
import { Platform } from "react-native";

/**
 * Hook for managing interstitial ads
 * Shows full-screen ads between user actions (Android/iOS only)
 * 
 * Ad Unit ID: ca-app-pub-6519568646843371/3099224050
 * 
 * Uses dynamic require to avoid crashes on platforms where
 * react-native-google-mobile-ads is not available
 */
export function useInterstitialAd() {
  const interstitialRef = useRef<any>(null);
  const isLoadingRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  // Ad unit ID
  const interstitialAdUnitId = "ca-app-pub-6519568646843371/3099224050";

  // Create and load interstitial ad
  const createInterstitialAd = useCallback(() => {
    // Only run on native platforms
    if (Platform.OS === "web") {
      console.log("⚠️ Interstitial ads not available on web");
      return null;
    }

    if (isLoadingRef.current) return null;
    isLoadingRef.current = true;

    try {
      // Dynamically require AdMob only when needed
      let InterstitialAd: any;
      let AdEventType: any;

      try {
        const adMobModule = require("react-native-google-mobile-ads");
        InterstitialAd = adMobModule.InterstitialAd;
        AdEventType = adMobModule.AdEventType;
      } catch (error) {
        console.warn("⚠️ AdMob module not available:", error);
        isLoadingRef.current = false;
        setIsReady(false);
        return null;
      }

      if (!InterstitialAd || !AdEventType) {
        console.warn("⚠️ AdMob components not available");
        isLoadingRef.current = false;
        setIsReady(false);
        return null;
      }

      const interstitial = InterstitialAd.createForAdRequest(interstitialAdUnitId, {
        keywords: ["video", "downloader", "facebook"],
      });

      // Handle ad events
      interstitial.addAdEventListener(AdEventType.LOADED, () => {
        console.log("✅ Interstitial ad loaded");
        isLoadingRef.current = false;
        setIsReady(true);
      });

      interstitial.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.log("❌ Interstitial ad error:", error);
        isLoadingRef.current = false;
        setIsReady(false);
      });

      interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        console.log("✅ Interstitial ad closed");
        // Reload ad for next use
        try {
          interstitial.load();
        } catch (err) {
          console.warn("⚠️ Failed to reload interstitial ad:", err);
        }
      });

      // Load the ad
      interstitial.load();
      interstitialRef.current = interstitial;

      return interstitial;
    } catch (error) {
      console.error("❌ Failed to create interstitial ad:", error);
      isLoadingRef.current = false;
      setIsReady(false);
      return null;
    }
  }, []);

  // Initialize ad on mount
  useEffect(() => {
    if (!interstitialRef.current && Platform.OS !== "web") {
      createInterstitialAd();
    }

    return () => {
      // Cleanup if needed
    };
  }, [createInterstitialAd]);

  // Show interstitial ad
  const showInterstitialAd = useCallback(async () => {
    try {
      // Only on native platforms
      if (Platform.OS === "web") {
        console.log("⚠️ Interstitial ads not available on web");
        return false;
      }

      // Create ad if not exists
      if (!interstitialRef.current) {
        createInterstitialAd();
        // Wait a bit for ad to load
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const interstitial = interstitialRef.current;
      if (interstitial && interstitial.loaded) {
        console.log("📢 Showing interstitial ad...");
        await interstitial.show();
        return true;
      } else {
        console.log("⚠️ Interstitial ad not ready yet");
        return false;
      }
    } catch (error) {
      console.error("❌ Failed to show interstitial ad:", error);
      return false;
    }
  }, [createInterstitialAd]);

  return { showInterstitialAd, isReady };
}