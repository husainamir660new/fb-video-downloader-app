/**
 * Downloading Screen - FB Video Downloader
 * ✅ FIXED: Removed extractVideoMetadata from dependencies to prevent infinite loop
 */

import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useDownload } from "@/lib/download-context";
import { useVideoDownload } from "@/hooks/use-video-download";
import { VideoQuality } from "@/lib/types";
import { cn } from "@/lib/utils";

// Dynamically import AdMob components only on native platforms
let BannerAdComponent: any = null;
let useInterstitialAd: any = null;

if (Platform.OS === "android" || Platform.OS === "ios") {
  try {
    BannerAdComponent = require("@/components/ads/banner-ad").BannerAdComponent;
    useInterstitialAd = require("@/hooks/use-interstitial-ad").useInterstitialAd;
  } catch (error) {
    console.warn("⚠️ Failed to load AdMob modules:", error);
  }
}

export default function DownloadingScreen() {
  const router = useRouter();
  const colors = useColors();
  const { videoMetadata } = useDownload();
  const { downloadVideo, extractVideoMetadata, progress, loading, error, success } =
    useVideoDownload();

  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>("480p");
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [downloadStarted, setDownloadStarted] = useState(false);

  // Initialize interstitial ad hook only on native platforms
  const interstitialAd = useInterstitialAd ? useInterstitialAd() : null;
  const showInterstitialAd = interstitialAd?.showInterstitialAd || (() => {});

  // ✅ FIXED: Extract video metadata on mount
  // CRITICAL: Do NOT include extractVideoMetadata in dependencies!
  useEffect(() => {
    if (!videoMetadata?.url) {
      router.back();
      return;
    }

    let isMounted = true;  // ✅ ADDED: Prevent state updates if component unmounts

    const extract = async () => {
      setExtracting(true);
      setExtractError(null);
      try {
        const info = await extractVideoMetadata(videoMetadata.url);
        if (isMounted) {  // ✅ ADDED: Check if component still mounted
          if (info) {
            setVideoInfo(info);
          } else {
            setExtractError("Failed to extract video information. Please check the URL and try again.");
          }
        }
      } catch (err) {
        if (isMounted) {  // ✅ ADDED: Check if component still mounted
          const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
          setExtractError(errorMsg);
          console.error("Failed to extract metadata:", err);
        }
      } finally {
        if (isMounted) {  // ✅ ADDED: Check if component still mounted
          setExtracting(false);
        }
      }
    };

    extract().catch((err) => {
      if (isMounted) {  // ✅ ADDED: Check if component still mounted
        console.error("Unhandled extraction error:", err);
        setExtractError("An unexpected error occurred. Please try again.");
        setExtracting(false);
      }
    });

    // ✅ ADDED: Cleanup function
    return () => {
      isMounted = false;
    };
  }, [videoMetadata?.url, router]);  // ✅ FIXED: Do NOT include extractVideoMetadata!

  // Handle successful download
  useEffect(() => {
    if (success && downloadStarted) {
      if (showInterstitialAd && typeof showInterstitialAd === "function") {
        try {
          showInterstitialAd();
        } catch (err) {
          console.warn("⚠️ Failed to show interstitial ad:", err);
        }
      }

      Alert.alert("Success", "Video downloaded successfully!", [
        {
          text: "OK",
          onPress: () => {
            router.back();
          },
        },
      ]);
      setDownloadStarted(false);
    }
  }, [success, downloadStarted, router, showInterstitialAd]);

  // Handle download error
  useEffect(() => {
    if (error && downloadStarted) {
      Alert.alert("Download Failed", error || "An error occurred during download");
      setDownloadStarted(false);
    }
  }, [error, downloadStarted]);

  const handleDownload = async () => {
    if (!videoMetadata?.url) {
      Alert.alert("Error", "No video URL provided");
      return;
    }

    setDownloadStarted(true);
    await downloadVideo(videoMetadata.url, selectedQuality);
  };

  if (extracting) {
    return (
      <ScreenContainer className="items-center justify-center">
        <View className="items-center gap-4">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-lg font-semibold text-foreground">
            Extracting video information...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Video Info Card */}
          {videoInfo && (
            <View className="gap-3 rounded-lg border border-border bg-surface p-4">
              <Text className="text-lg font-semibold text-foreground">
                {videoInfo.title || "Untitled"}
              </Text>
              <Text className="text-sm text-muted">
                Duration: {videoInfo.duration || "Unknown"}
              </Text>
              {videoInfo.thumbnail && (
                <View className="mt-2 h-40 rounded-lg bg-muted/20" />
              )}
            </View>
          )}

          {/* Quality Selection */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">
              Select Quality
            </Text>
            <View className="flex-row gap-3">
              {(["360p", "480p", "720p"] as const).map((quality) => (
                <TouchableOpacity
                  key={quality}
                  onPress={() => setSelectedQuality(quality)}
                  className={cn(
                    "flex-1 rounded-lg border-2 py-3 px-4",
                    selectedQuality === quality
                      ? "border-primary bg-primary/10"
                      : "border-border bg-surface"
                  )}
                >
                  <Text
                    className={cn(
                      "text-center font-semibold",
                      selectedQuality === quality
                        ? "text-primary"
                        : "text-foreground"
                    )}
                  >
                    {quality}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Progress Section */}
          {downloadStarted && (
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-foreground">
                  {loading ? "Downloading..." : "Download Complete"}
                </Text>
                <Text className="text-sm font-semibold text-primary">
                  {Math.round(progress)}%
                </Text>
              </View>
              <View className="h-2 overflow-hidden rounded-full bg-border">
                <View
                  className="h-full bg-primary"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </View>
            </View>
          )}

          {/* Extraction Error Message */}
          {extractError && (
            <View className="flex-row items-center gap-2 rounded-lg bg-error/10 px-4 py-3">
              <MaterialIcons name="error" size={18} color={colors.error} />
              <Text className="flex-1 text-sm text-error">{extractError}</Text>
            </View>
          )}

          {/* Download Error Message */}
          {error && (
            <View className="flex-row items-center gap-2 rounded-lg bg-error/10 px-4 py-3">
              <MaterialIcons name="error" size={18} color={colors.error} />
              <Text className="flex-1 text-sm text-error">{error}</Text>
            </View>
          )}

          {/* Download Button */}
          <TouchableOpacity
            onPress={handleDownload}
            disabled={loading || downloadStarted || extracting || !!extractError}
            className={cn(
              "rounded-lg py-4",
              loading || downloadStarted || extracting || extractError
                ? "bg-muted/50"
                : "bg-primary"
            )}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center justify-center gap-2">
              {loading ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <MaterialIcons
                  name="download"
                  size={20}
                  color={colors.background}
                />
              )}
              <Text className="text-lg font-semibold text-background">
                {loading ? "Downloading..." : "Download Video"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Info Card */}
          <View className="gap-3 rounded-lg border border-border bg-surface p-4">
            <View className="flex-row items-center gap-2">
              <MaterialIcons
                name="info"
                size={20}
                color={colors.primary}
              />
              <Text className="text-base font-semibold text-foreground">
                Download Info
              </Text>
            </View>
            <View className="gap-2">
              <Text className="text-sm text-muted leading-relaxed">
                • Select your preferred quality before downloading
              </Text>
              <Text className="text-sm text-muted leading-relaxed">
                • Higher quality requires more storage space
              </Text>
              <Text className="text-sm text-muted leading-relaxed">
                • Downloaded videos are saved to your device gallery
              </Text>
            </View>
          </View>

          {/* Banner Ad - Only on native platforms */}
          {BannerAdComponent && Platform.OS !== "web" && (
            <View className="mt-4">
              <BannerAdComponent />
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
