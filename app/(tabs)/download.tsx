/**
 * Download Screen - Video details and quality selection
 * Displays video metadata from mock extraction service
 */

import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { VideoPreviewCard } from "@/components/video-preview-card";
import { useColors } from "@/hooks/use-colors";
import { useDownload } from "@/lib/download-context";
import { MockVideoService } from "@/lib/mock-video-service";
import { AnalyticsService } from "@/lib/analytics-service";
import { VideoMetadata, VideoQuality } from "@/lib/types";

export default function DownloadScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams();
  const { selectedQuality, setSelectedQuality, isPremium } = useDownload();

  const [loading, setLoading] = useState(true);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentQuality, setCurrentQuality] = useState<VideoQuality>("480p");

  const videoUrl = params.url as string;
  const mockVideoService = MockVideoService.getInstance();
  const analytics = AnalyticsService.getInstance();

  // Load video metadata on mount
  useEffect(() => {
    loadVideoMetadata();
  }, []);

  const loadVideoMetadata = async () => {
    setLoading(true);
    setError(null);

    try {
      // Extract video metadata using mock service
      const metadata = await mockVideoService.extractVideoMetadata(videoUrl);

      if (!metadata) {
        setError("Could not extract video information. Please check the URL.");
        setLoading(false);
        return;
      }

      setVideoMetadata(metadata);
      setCurrentQuality("480p"); // Default to 480p

      // Track video extraction
      analytics.trackCustomEvent({
        name: "video_extracted",
        parameters: {
          video_id: metadata.id,
          title: metadata.title,
          duration: metadata.duration,
        },
      });
    } catch (err) {
      setError("Failed to load video information. Please try again.");
      console.error("Error loading video metadata:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQualitySelect = (quality: string) => {
    // Check if quality is locked for non-premium users
    if (quality === "720p" && !isPremium) {
      Alert.alert(
        "Premium Required",
        "720p HD quality is only available for Premium members. Upgrade now to unlock HD downloads.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Upgrade to Premium",
            style: "default",
            onPress: () => {
              router.push("/(tabs)/premium");
            },
          },
        ]
      );
      return;
    }

    setCurrentQuality(quality as VideoQuality);
    setSelectedQuality(quality as VideoQuality);

    // Track quality selection
    analytics.trackCustomEvent({
      name: "quality_selected",
      parameters: {
        video_id: videoMetadata?.id,
        quality: quality,
      },
    });
  };

  const handleDownload = async () => {
    if (!videoMetadata) {
      setError("Video metadata not loaded");
      return;
    }

    setLoading(true);

    try {
      // Track download start
      analytics.trackCustomEvent({
        name: "download_started",
        parameters: {
          video_id: videoMetadata.id,
          quality: currentQuality,
          title: videoMetadata.title,
        },
      });

      // Show download progress modal
      Alert.alert(
        "Download Started",
        `Downloading ${currentQuality} video...\n\nYou can view the progress in the download modal.`,
        [{ text: "OK" }]
      );

      // Navigate back to home after brief delay
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (err) {
      setError("Failed to start download. Please try again.");
      console.error("Error starting download:", err);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading && !videoMetadata) {
    return (
      <ScreenContainer className="items-center justify-center">
        <View className="gap-4 items-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-foreground font-semibold">
            Extracting video information...
          </Text>
          <Text className="text-muted text-sm text-center">
            Please wait while we fetch the video details
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  // Error state
  if (error && !videoMetadata) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center gap-4">
          <View className="w-16 h-16 rounded-full bg-error/10 items-center justify-center">
            <Text className="text-2xl">⚠️</Text>
          </View>
          <Text className="text-lg font-bold text-foreground text-center">
            Error Loading Video
          </Text>
          <Text className="text-sm text-muted text-center">{error}</Text>
          <TouchableOpacity
            onPress={() => {
              router.back();
            }}
            className="mt-4 px-6 py-3 rounded-lg bg-primary"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // Success state - display video preview
  return (
    <ScreenContainer className="p-4">
      <View className="flex-1 gap-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-2xl font-bold text-foreground">
            Download Video
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="px-3 py-2 rounded-lg bg-surface border border-border"
          >
            <Text className="text-foreground font-semibold">✕</Text>
          </TouchableOpacity>
        </View>

        {/* Video Preview Card */}
        {videoMetadata && (
          <VideoPreviewCard
            video={videoMetadata}
            selectedQuality={currentQuality}
            onQualitySelect={handleQualitySelect}
            isPremium={isPremium}
            onDownload={handleDownload}
          />
        )}

        {/* Premium Banner */}
        {!isPremium && (
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/premium")}
            className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/30 flex-row items-center justify-between"
          >
            <View className="flex-1 gap-1">
              <Text className="text-sm font-bold text-primary">
                ⭐ Unlock Premium
              </Text>
              <Text className="text-xs text-primary/80">
                Get 720p HD + faster downloads + no ads
              </Text>
            </View>
            <Text className="text-xl">→</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScreenContainer>
  );
}
