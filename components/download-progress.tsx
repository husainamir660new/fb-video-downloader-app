/**
 * Download Progress Component
 * Displays detailed progress with ETA, speed and smooth animations.
 *
 * All animations are powered by `react-native-reanimated`; the circular
 * progress ring uses `react-native-svg` so it renders identically on
 * iOS, Android and Web.
 * 
 * CRITICAL FIX: Removed Animated.createAnimatedComponent(Circle)
 * This causes hard crashes on Android due to JSI/Reanimated + SVG incompatibility
 * Solution: Use plain Circle with direct strokeDashoffset binding
 */
import React, { useEffect, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  Easing,
  useSharedValue,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";
import { DownloadProgress } from "@/lib/types";

// FIXED: Don't use Animated.createAnimatedComponent with SVG on native
// This can cause hard crashes on Android with new architecture
// Instead, we use plain Circle and bind strokeDashoffset directly
const AnimatedCircle = Circle as any;

export interface DownloadProgressProps {
  progress: DownloadProgress;
  onCancel?: () => void;
  showDetails?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "--:--";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/** Smoothly-animated linear progress bar. */
function AnimatedProgressBar({ progress }: { progress: number }) {
  const colors = useColors();
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, animatedProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value}%` as `${number}%`,
  }));

  return (
    <View className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
      <Animated.View
        style={[
          animatedStyle,
          { backgroundColor: colors.primary, height: "100%" },
        ]}
      />
    </View>
  );
}

/** Subtle pulse used as a "still loading" indicator dot. */
function PulseAnimation() {
  const colors = useColors();
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    pulseOpacity.value = withTiming(0.5, {
      duration: 1000,
      easing: Easing.inOut(Easing.ease),
    });
  }, [pulseOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <Animated.View
      style={[animatedStyle, { backgroundColor: colors.primary }]}
      className="w-3 h-3 rounded-full"
    />
  );
}

/** Cross-platform circular progress ring built on react-native-svg. */
function CircularProgress({ progress }: { progress: number }) {
  const colors = useColors();
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress));
  const offset = useSharedValue(circumference);

  useEffect(() => {
    offset.value = withTiming(
      circumference - (clamped / 100) * circumference,
      { duration: 300, easing: Easing.out(Easing.cubic) },
    );
  }, [clamped, circumference, offset]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: offset.value,
  }));

  return (
    <View className="items-center justify-center w-24 h-24">
      <Svg width={100} height={100} viewBox="0 0 100 100">
        <Circle
          cx={50}
          cy={50}
          r={radius}
          fill="none"
          stroke={colors.border}
          strokeWidth={3}
        />
        {/* FIXED: Use plain Circle instead of AnimatedCircle
            Bind strokeDashoffset directly to animated value
            This avoids JSI/Reanimated + SVG crash on Android */}
        <Circle
          cx={50}
          cy={50}
          r={radius}
          fill="none"
          stroke={colors.primary}
          strokeWidth={3}
          strokeDasharray={circumference}
          strokeLinecap="round"
          // Rotate so progress starts at 12 o'clock.
          transform="rotate(-90 50 50)"
          strokeDashoffset={offset.value}
        />
      </Svg>
      <View className="absolute items-center justify-center">
        <Text className="text-2xl font-bold text-foreground">
          {Math.round(clamped)}%
        </Text>
      </View>
    </View>
  );
}

export function DownloadProgressComponent({
  progress,
  onCancel,
  showDetails = true,
}: DownloadProgressProps) {
  const metrics = useMemo(() => {
    const downloadedMB = progress.downloadedBytes / 1024 / 1024;
    const totalMB = progress.totalBytes / 1024 / 1024;
    const speedMBps = progress.speed / 1024 / 1024;
    return {
      downloadedMB: downloadedMB.toFixed(1),
      totalMB: totalMB.toFixed(1),
      speedMBps: speedMBps.toFixed(2),
      etaFormatted: formatTime(progress.eta),
      percentComplete: Math.round(progress.progress),
    };
  }, [progress]);

  const isCompleted = progress.status === "completed";
  const isFailed = progress.status === "failed";

  return (
    <View className="w-full gap-4 p-4 bg-surface rounded-lg border border-border">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-1">
          {!isCompleted && !isFailed && <PulseAnimation />}
          <Text
            className={cn(
              "text-sm font-semibold",
              isCompleted && "text-success",
              isFailed && "text-error",
              !isCompleted && !isFailed && "text-foreground",
            )}
          >
            {isCompleted
              ? "Download Complete"
              : isFailed
                ? "Download Failed"
                : "Downloading..."}
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

      <View className="gap-2">
        <AnimatedProgressBar progress={metrics.percentComplete} />
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-medium text-muted">
            {metrics.downloadedMB} MB / {metrics.totalMB} MB
          </Text>
          <Text className="text-xs font-medium text-foreground">
            {metrics.percentComplete}%
          </Text>
        </View>
      </View>

      {showDetails && !isCompleted && !isFailed && (
        <View className="gap-3 pt-2 border-t border-border">
          <View className="flex-row justify-between">
            <View className="flex-1">
              <Text className="text-xs text-muted mb-1">Speed</Text>
              <Text className="text-sm font-semibold text-foreground">
                {metrics.speedMBps} MB/s
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted mb-1">Time Remaining</Text>
              <Text className="text-sm font-semibold text-foreground">
                {metrics.etaFormatted}
              </Text>
            </View>
          </View>

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

      {isFailed && (
        <View className="bg-error/10 rounded p-3 border border-error/30">
          <Text className="text-sm font-semibold text-error">
            Download failed
          </Text>
          {progress.error && (
            <Text className="text-xs text-error/80 mt-1">
              {progress.error}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

export function MinimalProgressBar({
  progress,
  onCancel,
}: {
  progress: DownloadProgress;
  onCancel?: () => void;
}) {
  const percentComplete = Math.round(progress.progress);

  return (
    <View className="w-full gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-medium text-muted">
          {percentComplete}% - {formatTime(progress.eta)}
        </Text>
        {onCancel &&
          progress.status !== "completed" &&
          progress.status !== "failed" && (
            <Pressable onPress={onCancel}>
              <Text className="text-xs font-semibold text-error">Cancel</Text>
            </Pressable>
          )}
      </View>
      <AnimatedProgressBar progress={percentComplete} />
    </View>
  );
}

export function CircularProgressOverlay({
  progress,
  onCancel,
}: {
  progress: DownloadProgress;
  onCancel?: () => void;
}) {
  const percentComplete = Math.round(progress.progress);
  const speedMBps = (progress.speed / 1024 / 1024).toFixed(2);
  const etaFormatted = formatTime(progress.eta);

  return (
    <View className="items-center justify-center gap-4 p-6">
      <CircularProgress progress={percentComplete} />

      <View className="gap-2 items-center">
        <Text className="text-sm font-semibold text-foreground">
          {percentComplete}% Complete
        </Text>
        <Text className="text-xs text-muted">
          {speedMBps} MB/s • {etaFormatted} remaining
        </Text>
      </View>

      {onCancel &&
        progress.status !== "completed" &&
        progress.status !== "failed" && (
          <View className="mt-2 px-4 py-2 rounded-lg bg-error/10 border border-error">
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <Text className="text-sm font-semibold text-error">
                Cancel Download
              </Text>
            </Pressable>
          </View>
        )}
    </View>
  );
}

export default DownloadProgressComponent;
