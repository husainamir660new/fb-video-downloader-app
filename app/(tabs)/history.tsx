/**
 * Home Screen - FB Video Downloader
 * ✅ FIXED VERSION - Improved URL validation
 * 
 * Fixes applied:
 * 1. ✅ Use advanced facebook-url-parser for 20+ URL formats
 * 2. ✅ Better error messages
 * 3. ✅ Safe AdMob loading
 */

import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useDownload } from "@/lib/download-context";
import { cn } from "@/lib/utils";
import { isFacebookVideoUrl, extractFacebookVideoId } from "@/lib/facebook-url-parser";

// ✅ FIXED: Safe loading of BannerAdComponent
let BannerAdComponent: React.ComponentType<any> | null = null;
if (Platform.OS === "android" || Platform.OS === "ios") {
  try {
    const bannerModule = require("@/components/ads/banner-ad");
    if (bannerModule?.BannerAdComponent) {
      BannerAdComponent = bannerModule.BannerAdComponent;
    }
  } catch (error) {
    console.warn("⚠️ Failed to load BannerAdComponent:", error);
    BannerAdComponent = null;
  }
}

// ✅ FIXED: Use advanced URL validation from facebook-url-parser
function isValidFacebookUrl(url: string): boolean {
  return isFacebookVideoUrl(url);
}

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { setVideoMetadata } = useDownload();

  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [hasClipboard, setHasClipboard] = useState(false);

  // Check clipboard on mount
  useEffect(() => {
    checkClipboard();
  }, []);

  const checkClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text && isValidFacebookUrl(text)) {
        setHasClipboard(true);
      }
    } catch (err) {
      console.log("Clipboard check failed:", err);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setUrl(text);
        setError("");
      }
    } catch (err) {
      setError("Failed to paste from clipboard");
    }
  };

  const handleExtractInfo = async () => {
    if (!url.trim()) {
      setError("Please enter a Facebook video URL");
      return;
    }

    // ✅ FIXED: Better URL validation with detailed error messages
    if (!isValidFacebookUrl(url)) {
      setError(
        "Please enter a valid Facebook video URL (e.g., facebook.com/watch/?v=..., fb.watch/..., facebook.com/share/v/...)"
      );
      return;
    }

    // ✅ FIXED: Verify video ID can be extracted
    const videoId = extractFacebookVideoId(url);
    if (!videoId) {
      setError(
        "Could not extract video ID from URL. Please check the link and try again."
      );
      return;
    }

    try {
      setError("");
      // Set minimal metadata - full metadata will be extracted on downloading screen
      setVideoMetadata({
        id: videoId,
        title: "Loading...",
        duration: 0,
        thumbnail: "",
        url: url.trim(),
      });
      router.push("/(tabs)/downloading");
    } catch (err) {
      setError("Failed to process URL");
      console.error(err);
    }
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-8">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-4xl font-bold text-foreground">
              FB Video Downloader
            </Text>
            <Text className="text-base text-muted text-center">
              Download Facebook videos in HD quality
            </Text>
          </View>

          {/* URL Input Section */}
          <View className="gap-4">
            <Text className="text-lg font-semibold text-foreground">
              Video URL
            </Text>

            {/* URL Input Field */}
            <View
              className={cn(
                "flex-row items-center gap-3 rounded-lg border px-4 py-3",
                error ? "border-error bg-error/10" : "border-border bg-surface"
              )}
            >
              <MaterialIcons
                name="link"
                size={20}
                color={error ? colors.error : colors.foreground}
              />
              <TextInput
                className="flex-1 text-foreground"
                placeholder="https://www.facebook.com/share/v/..."
                placeholderTextColor={colors.muted}
                value={url}
                onChangeText={(text ) => {
                  setUrl(text);
                  if (error) setError("");
                }}
                editable={true}
              />
              {hasClipboard && !url && (
                <TouchableOpacity
                  onPress={handlePasteFromClipboard}
                  className="px-3 py-2"
                >
                  <MaterialIcons
                    name="content-paste"
                    size={20}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Error Message */}
            {error && (
              <View className="flex-row items-center gap-2 rounded-lg bg-error/10 px-4 py-3">
                <MaterialIcons name="error" size={18} color={colors.error} />
                <Text className="flex-1 text-sm text-error">{error}</Text>
              </View>
            )}
          </View>

          {/* Extract Button */}
          <TouchableOpacity
            onPress={handleExtractInfo}
            className="rounded-lg bg-primary py-4"
            activeOpacity={0.8}
          >
            <View className="flex-row items-center justify-center gap-2">
              <MaterialIcons name="search" size={20} color={colors.background} />
              <Text className="text-lg font-semibold text-background">
                Extract Video Info
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
                How to use
              </Text>
            </View>
            <View className="gap-2">
              <Text className="text-sm text-muted leading-relaxed">
                1. Copy a Facebook video URL
              </Text>
              <Text className="text-sm text-muted leading-relaxed">
                2. Paste it above or use the clipboard button
              </Text>
              <Text className="text-sm text-muted leading-relaxed">
                3. Select your preferred quality
              </Text>
              <Text className="text-sm text-muted leading-relaxed">
                4. Download to your device
              </Text>
            </View>
          </View>

          {/* Supported Formats */}
          <View className="gap-3 rounded-lg border border-border bg-surface p-4">
            <View className="flex-row items-center gap-2">
              <MaterialIcons
                name="video-library"
                size={20}
                color={colors.primary}
              />
              <Text className="text-base font-semibold text-foreground">
                Supported Formats
              </Text>
            </View>
            <View className="gap-1">
              <Text className="text-sm text-muted">
                • MP4 (H.264 video codec)
              </Text>
              <Text className="text-sm text-muted">
                • AAC audio codec
              </Text>
              <Text className="text-sm text-muted">
                • Multiple quality options (360p, 480p, 720p)
              </Text>
            </View>
          </View>

          {/* Supported URL Formats */}
          <View className="gap-3 rounded-lg border border-border bg-surface p-4">
            <View className="flex-row items-center gap-2">
              <MaterialIcons
                name="link"
                size={20}
                color={colors.primary}
              />
              <Text className="text-base font-semibold text-foreground">
                Supported URL Formats
              </Text>
            </View>
            <View className="gap-1">
              <Text className="text-sm text-muted">
                • facebook.com/watch/?v=...
              </Text>
              <Text className="text-sm text-muted">
                • facebook.com/video.php?v=...
              </Text>
              <Text className="text-sm text-muted">
                • facebook.com/share/v/...
              </Text>
              <Text className="text-sm text-muted">
                • facebook.com/reel/...
              </Text>
              <Text className="text-sm text-muted">
                • fb.watch/...
              </Text>
              <Text className="text-sm text-muted">
                • m.facebook.com/... (mobile)
              </Text>
            </View>
          </View>

          {/* ✅ FIXED: Banner Ad - Safe rendering only on native platforms */}
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
