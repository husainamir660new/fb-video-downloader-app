/**
 * Download Progress Component
 * Displays detailed progress with ETA, speed, and smooth animations
 */

import React, { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
  useSharedValue,
  useEffect,
} from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";
import { DownloadProgress } from "@/lib/types";

export interface DownloadProgressProps {
  progress: DownloadProgress;
  onCancel?: () => void;
  showDetails?: boolean;
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
}

/**
 * Format seconds to time string (HH:MM:SS)
 */
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "--:--";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Animated Progress Bar Component
 */
function AnimatedProgressBar({ progress }: { progress: number }) {
  const colors = useColors();
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, animatedProgress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${animatedProgress.value}%`,
    };
  });

  return (
    <View className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
      <Animated.View
        style={[
          animatedStyle,
          {
            backgroundColor: colors.primary,
            height: "100%",
          },
        ]}
      />
    </View>
  );
}

/**
 * Pulse Animation Component (for loading state)
 */
function PulseAnimation() {
  const colors = useColors();
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    pulseOpacity.value = withTiming(0.5, {
      duration: 1000,
      easing: Easing.inOut(Easing.ease),
    });
    pulseOpacity.value = withTiming(1, {
      duration: 1000,
      easing: Easing.inOut(Easing.ease),
    });
  }, [pulseOpacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: pulseOpacity.value,
    };
  });

  return (
    <Animated.View
      style={animatedStyle}
      className="w-3 h-3 rounded-full"
      style={{ backgroundColor: colors.primary }}
    />
  );
}

/**
 * Circular Progress Indicator
 */
function CircularProgress({ progress }: { progress: number }) {
  const colors = useColors();
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      strokeDashoffset: withTiming(strokeDashoffset, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      }),
    };
  });

  return (
    <View className="items-center justify-center w-24 h-24">
      <svg width="100" height="100" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={colors.border}
          strokeWidth="3"
        />
        {/* Progress circle */}
        <Animated.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={colors.primary}
          strokeWidth="3"
          strokeDasharray={circumference}
          style={animatedStyle}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <View className="absolute items-center justify-center">
        <Text className="text-2xl font-bold text-foreground">{Math.round(progress)}%</Text>
      </View>
    </View>
  );
}

/**
 * Download Progress Component
 */
export function DownloadProgressComponent({
  progress,
  onCancel,
  showDetails = true,
}: DownloadProgressProps) {
  const colors = useColors();

  // Calculate metrics
  const metrics = useMemo(() => {
    const downloadedMB = progress.downloadedBytes / 1024 / 1024;
    const totalMB = progress.totalBytes / 1024 / 1024;
    const speedMBps = progress.speed / 1024 / 1024;
    const etaSeconds = progress.eta;

    return {
      downloadedMB: downloadedMB.toFixed(1),
      totalMB: totalMB.toFixed(1),
      speedMBps: speedMBps.toFixed(2),
      etaFormatted: formatTime(etaSeconds),
      etaSeconds,
      percentComplete: Math.round(progress.progress),
    };
  }, [progress]);

  const isCompleted = progress.status === "completed";
  const isFailed = progress.status === "failed";

  return (
    <View className="w-full gap-4 p-4 bg-surface rounded-lg border border-border">
      {/* Header with status */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-1">
          {!isCompleted && !isFailed && <PulseAnimation />}
          <Text
            className={cn(
              "text-sm font-semibold",
              isCompleted && "text-success",
              isFailed && "text-error",
              !isCompleted && !isFailed && "text-foreground"
            )}
          >
            {isCompleted ? "Download Complete" : isFailed ? "Download Failed" : "Downloading..."}
          </Text>
        </View>
        {onCancel && !isCompleted && !isFailed && (
          <Pressable
            onPress={onCancel}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text className="text-sm font-semibold text-error">Cancel</Text>
          </Pressable>
        )}
      </View>

      {/* Main Progress Bar */}
      <View className="gap-2">
        <AnimatedProgressBar progress={metrics.percentComplete} />
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-medium text-muted">
            {metrics.downloadedMB} MB / {metrics.totalMB} MB
          </Text>
          <Text className="text-xs font-medium text-foreground">{metrics.percentComplete}%</Text>
        </View>
      </View>

      {/* Detailed Metrics */}
      {showDetails && !isCompleted && !isFailed && (
        <View className="gap-3 pt-2 border-t border-border">
          {/* Speed and ETA Row */}
          <View className="flex-row justify-between">
            <View className="flex-1">
              <Text className="text-xs text-muted mb-1">Speed</Text>
              <Text className="text-sm font-semibold text-foreground">
                {metrics.speedMBps} MB/s
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted mb-1">Time Remaining</Text>
              <Text className="text-sm font-semibold text-foreground">{metrics.etaFormatted}</Text>
            </View>
          </View>

          {/* Detailed Breakdown */}
          <View className="bg-background/50 rounded p-2 gap-1">
            <View className="flex-row justify-between">
              <Text className="text-xs text-muted">Downloaded:</Text>
              <Text className="text-xs font-medium text-foreground">
                {formatBytes(progress.downloadedBytes)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-muted">Total Size:</Text>
              <Text className="text-xs font-medium text-foreground">
                {formatBytes(progress.totalBytes)}
              </Text>
            </View>
            {progress.error && (
              <View className="flex-row justify-between pt-1 border-t border-border/50">
                <Text className="text-xs text-error">Error:</Text>
                <Text className="text-xs font-medium text-error flex-1 text-right">
                  {progress.error}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Completion Message */}
      {isCompleted && (
        <View className="bg-success/10 rounded p-3 border border-success/30">
          <Text className="text-sm font-semibold text-success">
            Video downloaded successfully!
          </Text>
          <Text className="text-xs text-success/80 mt-1">
            You can find it in your download history.
          </Text>
        </View>
      )}

      {/* Error Message */}
      {isFailed && (
        <View className="bg-error/10 rounded p-3 border border-error/30">
          <Text className="text-sm font-semibold text-error">Download failed</Text>
          {progress.error && (
            <Text className="text-xs text-error/80 mt-1">{progress.error}</Text>
          )}
        </View>
      )}
    </View>
  );
}

/**
 * Minimal Progress Bar Component (for compact display)
 */
export function MinimalProgressBar({
  progress,
  onCancel,
}: {
  progress: DownloadProgress;
  onCancel?: () => void;
}) {
  const colors = useColors();
  const percentComplete = Math.round(progress.progress);

  return (
    <View className="w-full gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-medium text-muted">
          {percentComplete}% - {formatTime(progress.eta)}
        </Text>
        {onCancel && progress.status !== "completed" && progress.status !== "failed" && (
          <Pressable onPress={onCancel}>
            <Text className="text-xs font-semibold text-error">Cancel</Text>
          </Pressable>
        )}
      </View>
      <AnimatedProgressBar progress={percentComplete} />
    </View>
  );
}

/**
 * Circular Progress Component (for modal/overlay)
 */
export function CircularProgressOverlay({
  progress,
  onCancel,
}: {
  progress: DownloadProgress;
  onCancel?: () => void;
}) {
  const colors = useColors();
  const percentComplete = Math.round(progress.progress);
  const speedMBps = (progress.speed / 1024 / 1024).toFixed(2);
  const etaFormatted = formatTime(progress.eta);

  return (
    <View className="items-center justify-center gap-4 p-6">
      <CircularProgress progress={percentComplete} />

      <View className="gap-2 items-center">
        <Text className="text-sm font-semibold text-foreground">{percentComplete}% Complete</Text>
        <Text className="text-xs text-muted">
          {speedMBps} MB/s • {etaFormatted} remaining
        </Text>
      </View>

      {onCancel && progress.status !== "completed" && progress.status !== "failed" && (
        <Pressable
          onPress={onCancel}
          className="mt-2 px-4 py-2 rounded-lg bg-error/10 border border-error"
        >
          <Text className="text-sm font-semibold text-error">Cancel Download</Text>
        </Pressable>
      )}
    </View>
  );
}

export default DownloadProgressComponent;
