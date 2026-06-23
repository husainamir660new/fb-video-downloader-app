/**
 * Download Modal Component
 * Displays download progress as a modal overlay
 */

import React from "react";
import { Modal, View, Text, Pressable, SafeAreaView } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { CircularProgressOverlay, MinimalProgressBar } from "./download-progress";
import { DownloadProgress } from "@/lib/types";
import { useColors } from "@/hooks/use-colors";

export interface DownloadModalProps {
  visible: boolean;
  progress: DownloadProgress;
  onCancel?: () => void;
  onDismiss?: () => void;
  title?: string;
  subtitle?: string;
}

/**
 * Download Progress Modal
 */
export function DownloadModal({
  visible,
  progress,
  onCancel,
  onDismiss,
  title = "Downloading Video",
  subtitle = "Please wait...",
}: DownloadModalProps) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <BlurView intensity={90} className="flex-1">
        <SafeAreaView className="flex-1 items-center justify-center p-4">
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            className="w-full max-w-sm bg-surface rounded-2xl p-6 gap-4 shadow-lg"
            style={{
              borderColor: colors.border,
              borderWidth: 1,
            }}
          >
            {/* Header */}
            <View className="gap-1">
              <Text className="text-lg font-bold text-foreground">{title}</Text>
              <Text className="text-sm text-muted">{subtitle}</Text>
            </View>

            {/* Progress Content */}
            <CircularProgressOverlay progress={progress} onCancel={onCancel} />

            {/* Dismiss Button (only on completion) */}
            {progress.status === "completed" && onDismiss && (
              <Pressable
                onPress={onDismiss}
                className="mt-2 px-4 py-3 rounded-lg bg-primary"
                style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              >
                <Text className="text-center text-sm font-semibold text-background">
                  Done
                </Text>
              </Pressable>
            )}
          </Animated.View>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );
}

/**
 * Minimal Download Progress Sheet
 * Compact version for bottom sheet or inline display
 */
export function DownloadProgressSheet({
  progress,
  onCancel,
  title = "Downloading",
}: {
  progress: DownloadProgress;
  onCancel?: () => void;
  title?: string;
}) {
  const colors = useColors();

  return (
    <View className="gap-3 p-4 bg-surface rounded-t-2xl border-t border-border">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        {onCancel && progress.status !== "completed" && progress.status !== "failed" && (
          <Pressable onPress={onCancel}>
            <Text className="text-xs font-semibold text-error">Cancel</Text>
          </Pressable>
        )}
      </View>

      {/* Progress Bar */}
      <MinimalProgressBar progress={progress} onCancel={onCancel} />
    </View>
  );
}

export default DownloadModal;
