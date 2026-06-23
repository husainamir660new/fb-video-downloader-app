/**
 * Downloading Screen - FB Video Downloader
 * Complete download implementation with progress tracking and error handling
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useDownload } from "@/lib/download-context";
import { useVideoDownload } from "@/hooks/use-video-download";
import { VideoQuality } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function DownloadingScreen() {
  const router = useRouter();
  const colors = useColors();
  const { videoMetadata } = useDownload();
  const { downloadVideo, extractVideoMetadata, progress, loading, error, success } =
    useVideoDownload();

  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>("480p");
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [extracting, setExtracting] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  // Extract video metadata on mount
  useEffect(() => {
    if (!videoMetadata?.url) {
      router.back();
      return;
    }

    const extract = async () => {
      setExtracting(true);
      const info = await extractVideoMetadata(videoMetadata.url);
      if (info) {
        setVideoInfo(info);
      }
      setExtracting(false);
    };

    extract();
  }, [videoMetadata?.url, extractVideoMetadata, router]);

  // Handle successful download
  useEffect(() => {
    if (success && downloadStarted) {
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
  }, [success, downloadStarted, router]);

  // Handle download error
  useEffect(() => {
    if (error && downloadStarted) {
      Alert.alert("Download Failed", error, [
        {
          text: "Try Again",
          onPress: () => setDownloadStarted(false),
        },
        {
          text: "Cancel",
          onPress: () => {
            router.back();
          },
        },
      ]);
      setDownloadStarted(false);
    }
  }, [error, downloadStarted, router]);

  const handleDownload = useCallback(async () => {
    if (!videoMetadata?.url) {
      Alert.alert("Error", "No video URL provided");
      return;
    }

    setDownloadStarted(true);
    await downloadVideo(videoMetadata.url, selectedQuality);
  }, [videoMetadata?.url, selectedQuality, downloadVideo]);

  if (!videoMetadata?.url) {
    return (
      <ScreenContainer className="bg-background items-center justify-center">
        <Text className="text-foreground text-lg">No video selected</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 gap-6 p-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Download Video</Text>
            <Text className="text-base text-muted">
              {videoInfo?.title || "Facebook Video"}
            </Text>
          </View>

          {/* Video Info */}
          {extracting ? (
            <View className="bg-surface rounded-lg p-6 items-center gap-3">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-foreground">Extracting video information...</Text>
            </View>
          ) : videoInfo ? (
            <View className="bg-surface rounded-lg p-4 gap-3 border border-border">
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="info" size={20} color={colors.primary} />
                <Text className="flex-1 text-sm text-foreground font-semibold">
                  Video Information
                </Text>
              </View>
              <Text className="text-xs text-muted">
                Duration: {videoInfo.duration ? `${Math.floor(videoInfo.duration / 60)}:${String(videoInfo.duration % 60).padStart(2, "0")}` : "Unknown"}
              </Text>
              {videoInfo.qualities && videoInfo.qualities.length > 0 && (
                <Text className="text-xs text-muted">
                  Available: {videoInfo.qualities.join(", ")}
                </Text>
              )}
            </View>
          ) : null}

          {/* Quality Selection */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Select Quality</Text>
            <View className="gap-2">
              {["360p", "480p", "720p"].map((quality) => (
                <TouchableOpacity
                  key={quality}
                  onPress={() => setSelectedQuality(quality as VideoQuality)}
                  className={cn(
                    "flex-row items-center gap-3 p-3 rounded-lg border",
                    selectedQuality === quality
                      ? "bg-primary/10 border-primary"
                      : "bg-surface border-border"
                  )}
                >
                  <View
                    className={cn(
                      "w-5 h-5 rounded-full border-2",
                      selectedQuality === quality
                        ? "bg-primary border-primary"
                        : "border-muted"
                    )}
                  />
                  <Text
                    className={cn(
                      "flex-1 font-semibold",
                      selectedQuality === quality ? "text-primary" : "text-foreground"
                    )}
                  >
                    {quality}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Download Progress */}
          {downloadStarted && (
            <View className="bg-surface rounded-lg p-4 gap-3 border border-border">
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color={colors.primary} />
                <Text className="flex-1 text-sm font-semibold text-foreground">
                  {loading ? "Downloading..." : "Processing..."}
                </Text>
              </View>
              <View className="w-full h-2 bg-border rounded-full overflow-hidden">
                <View
                  className="h-full bg-primary"
                  style={{ width: `${progress}%` }}
                />
              </View>
              <Text className="text-xs text-muted text-center">{progress}%</Text>
            </View>
          )}

          {/* Download Button */}
          <TouchableOpacity
            onPress={handleDownload}
            disabled={loading || downloadStarted}
            className={cn(
              "rounded-lg py-4 items-center",
              loading || downloadStarted ? "bg-muted" : "bg-primary"
            )}
          >
            <View className="flex-row items-center gap-2">
              {loading || downloadStarted ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <MaterialIcons name="download" size={20} color="white" />
              )}
              <Text className="text-white font-bold text-base">
                {loading || downloadStarted ? "Downloading..." : "Download Video"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Error Message */}
          {error && !downloadStarted && (
            <View className="bg-error/10 border border-error rounded-lg p-4 gap-2">
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="error" size={18} color={colors.error} />
                <Text className="flex-1 text-xs font-semibold text-error">Error</Text>
              </View>
              <Text className="text-xs text-error">{error}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
