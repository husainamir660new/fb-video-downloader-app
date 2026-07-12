/**
 * Home Screen - FB Video Downloader
 * Complete working implementation with proper error handling
 */

import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useDownload } from "@/lib/download-context";
import { cn } from "@/lib/utils";
// اضافه شده برای فعال‌سازی تبلیغات
import { BannerAdComponent } from "@/components/ads/banner-ad";

function isValidFacebookUrl(url: string): boolean {
  try {
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }
    const urlObj = new URL(formattedUrl);
    return /facebook\.com|fb\.watch|fb\.com/.test(urlObj.hostname);
  } catch {
    return false;
  }
}

/**
 * ⚡️ تابع حل‌کننده پیشرفته لینک با قابلیت استخراج لینک اصلی از دیوار لاگین
 */
const resolveFacebookUrlClientSide = async (inputUrl: string): Promise<string> => {
  let trimmed = inputUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = "https://" + trimmed;
  }

  if (!trimmed.includes("share") && !trimmed.includes("fb.watch") && !trimmed.includes("fb.com")) {
    return trimmed;
  }

  console.log("[Client Resolver] Expanding short link using mobile IP...");
  try {
    const response = await fetch(trimmed, {
      method: "GET",
      redirect: "follow",
    });

    if (response.url) {
      // 🎯 شکار بزرگ: اگر به صفحه لاگین هدایت شدیم، لینک اصلی ویدیو را از پارامتر next برمی‌داریم
      if (response.url.includes("/login") || response.url.includes("checkpoint")) {
        const urlObj = new URL(response.url);
        const nextParam = urlObj.searchParams.get("next");
        if (nextParam) {
          const decodedUrl = decodeURIComponent(nextParam);
          console.log("[Client Resolver] Extracted real URL from login wall:", decodedUrl);
          return decodedUrl;
        }
      }
      
      console.log("[Client Resolver] Successfully expanded to:", response.url);
      return response.url;
    }
  } catch (error) {
    console.warn("[Client Resolver] Device redirect failed, bypassing to original.");
  }
  return trimmed;
};

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { setVideoMetadata } = useDownload();

  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [hasClipboard, setHasClipboard] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

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

    if (!isValidFacebookUrl(url)) {
      setError("Please enter a valid Facebook video URL");
      return;
    }

    try {
      setError("");
      setIsResolving(true);

      const finalUrl = await resolveFacebookUrlClientSide(url);

      setVideoMetadata({
        id: Date.now().toString(),
        title: "Loading...",
        duration: 0,
        thumbnail: "",
        url: finalUrl,
      });
      
      setIsResolving(false);
      router.push("/(tabs)/downloading");
    } catch (err) {
      setIsResolving(false);
      setError("Failed to process URL");
      console.error(err);
    }
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-8">
          <View className="items-center gap-2">
            <Text className="text-4xl font-bold text-foreground">FB Video Downloader</Text>
            <Text className="text-base text-muted text-center">Download Facebook videos in HD quality</Text>
          </View>

          <View className="gap-4">
            <Text className="text-lg font-semibold text-foreground">Video URL</Text>
            <View className={cn("flex-row items-center gap-3 rounded-lg border px-4 py-3", error ? "border-error bg-error/10" : "border-border bg-surface")}>
              <MaterialIcons name="link" size={20} color={error ? colors.error : colors.foreground} />
              <TextInput
                className="flex-1 text-foreground"
                placeholder="https://www.facebook.com/share/v/..."
                placeholderTextColor={colors.muted}
                value={url}
                onChangeText={(text) => { setUrl(text); if (error) setError(""); }}
                editable={!isResolving}
              />
              {hasClipboard && !url && (
                <TouchableOpacity onPress={handlePasteFromClipboard} className="px-3 py-2">
                  <MaterialIcons name="content-paste" size={20} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            {error && (
              <View className="flex-row items-center gap-2 rounded-lg bg-error/10 px-4 py-3">
                <MaterialIcons name="error" size={18} color={colors.error} />
                <Text className="flex-1 text-sm text-error">{error}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={handleExtractInfo}
            disabled={isResolving}
            className={cn("rounded-lg py-4", isResolving ? "bg-primary/60" : "bg-primary")}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center justify-center gap-2">
              {isResolving ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <MaterialIcons name="search" size={20} color={colors.background} />
              )}
              <Text className="text-lg font-semibold text-background">
                {isResolving ? "Analyzing Secure Link..." : "Extract Video Info"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* تبلیغات فعال شده‌اند - در بیلد نهایی APK نمایش داده می‌شوند */}
          <View className="mt-auto items-center pt-8">
            <BannerAdComponent />
          </View>

        </View>
      </ScrollView>
    </ScreenContainer>
  );
}