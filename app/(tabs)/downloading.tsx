/**
 * Downloading Screen
 * Displays download progress with detailed metrics and animations
 */

import React, { useState, useEffect } from "react";
import { ScrollView, View, Text, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import {
  DownloadProgressComponent,
  CircularProgressOverlay,
} from "@/components/download-progress";
import { useDownload } from "@/lib/download-context";
import { DownloadService } from "@/lib/download-service";
import { AnalyticsService } from "@/lib/analytics-service";
import { DownloadProgress } from "@/lib/types";

export default function DownloadingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isPremium } = useDownload();
  const [progress, setProgress] = useState<DownloadProgress>({
    videoId: params.videoId as string,
    progress: 0,
    downloadedBytes: 0,
    totalBytes: 0,
    speed: 0,
    eta: 0,
    status: "downloading",
  });
  const [showCircular, setShowCircular] = useState(false);

  const downloadService = DownloadService.getInstance();
  const analytics = AnalyticsService.getInstance();

  useEffect(() => {
    // Track screen view
    analytics.trackScreenView("downloading");

    // Simulate download progress
    simulateDownload();
  }, []);

  /**
   * Simulate download progress (mock implementation)
   * TODO: Replace with actual download logic
   */
  const simulateDownload = async () => {
    const totalSize = isPremium ? 150 * 1024 * 1024 : 100 * 1024 * 1024; // 150MB for 720p, 100MB for 480p
    const quality = (params.quality as string) || "480p";
    let downloadedBytes = 0;
    const startTime = Date.now();

    // Simulate variable download speed
    const baseSpeed = isPremium ? 5 * 1024 * 1024 : 3 * 1024 * 1024; // 5MB/s for premium, 3MB/s for free
    const speedVariation = 0.8 + Math.random() * 0.4; // 0.8x to 1.2x variation

    const interval = setInterval(() => {
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const currentSpeed = baseSpeed * speedVariation;

      downloadedBytes = Math.min(currentSpeed * elapsedSeconds, totalSize);
      const percentComplete = (downloadedBytes / totalSize) * 100;
      const remainingBytes = totalSize - downloadedBytes;
      const eta = remainingBytes / currentSpeed;

      setProgress({
        videoId: params.videoId as string,
        progress: percentComplete,
        downloadedBytes,
        totalBytes: totalSize,
        speed: currentSpeed,
        eta,
        status: percentComplete >= 100 ? "completed" : "downloading",
      });

      // Complete download
      if (percentComplete >= 100) {
        clearInterval(interval);
        setProgress((prev) => ({ ...prev, status: "completed", progress: 100 }));

        // Track download completion
        analytics.trackVideoDownload(
          params.videoId as string,
          quality,
          totalSize
        );

        // Auto-navigate after 2 seconds
        setTimeout(() => {
          router.back();
        }, 2000);
      }
    }, 100);

    return () => clearInterval(interval);
  };

  /**
   * Handle download cancellation
   */
  const handleCancel = () => {
    Alert.alert("Cancel Download", "Are you sure you want to cancel this download?", [
      { text: "Keep Downloading", style: "cancel" },
      {
        text: "Cancel",
        style: "destructive",
        onPress: () => {
          analytics.trackCustomEvent({
            name: "download_cancelled",
            parameters: {
              video_id: params.videoId,
              progress: progress.progress,
            },
          });
          router.back();
        },
      },
    ]);
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-center gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">Downloading Video</Text>
            <Text className="text-sm text-muted">
              {isPremium ? "Premium HD Quality" : "Standard Quality"}
            </Text>
          </View>

          {/* Toggle View Button */}
          <View className="flex-row gap-2 justify-center">
            <View
              className={`px-4 py-2 rounded-lg border ${
                !showCircular
                  ? "bg-primary/10 border-primary"
                  : "bg-surface border-border"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  !showCircular ? "text-primary" : "text-muted"
                }`}
                onPress={() => setShowCircular(false)}
              >
                Details
              </Text>
            </View>
            <View
              className={`px-4 py-2 rounded-lg border ${
                showCircular
                  ? "bg-primary/10 border-primary"
                  : "bg-surface border-border"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  showCircular ? "text-primary" : "text-muted"
                }`}
                onPress={() => setShowCircular(true)}
              >
                Circular
              </Text>
            </View>
          </View>

          {/* Progress Display */}
          {showCircular ? (
            <CircularProgressOverlay progress={progress} onCancel={handleCancel} />
          ) : (
            <DownloadProgressComponent
              progress={progress}
              onCancel={handleCancel}
              showDetails={true}
            />
          )}

          {/* Tips Section */}
          {progress.status === "downloading" && (
            <View className="bg-surface/50 rounded-lg p-4 border border-border/50 gap-2">
              <Text className="text-xs font-semibold text-foreground">💡 Tip</Text>
              <Text className="text-xs text-muted leading-relaxed">
                Keep the app in the foreground for optimal download speed. You can minimize the
                app but it may pause the download.
              </Text>
            </View>
          )}

          {/* Completion Message */}
          {progress.status === "completed" && (
            <View className="bg-success/10 rounded-lg p-4 border border-success/30 gap-2">
              <Text className="text-sm font-bold text-success">✓ Download Complete!</Text>
              <Text className="text-xs text-success/80">
                Your video has been saved to your downloads. Returning to home screen...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
