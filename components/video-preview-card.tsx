/**
 * Video Preview Card Component
 * Displays video thumbnail, title, duration, and resolution options
 */

import React, { useMemo } from "react";
import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { VideoMetadata } from "@/lib/types";
import { MockVideoService } from "@/lib/mock-video-service";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

export interface VideoPreviewCardProps {
  video: VideoMetadata;
  selectedQuality?: string;
  onQualitySelect?: (quality: string) => void;
  isPremium?: boolean;
  onDownload?: (quality: string) => void;
}

/**
 * Quality Badge Component
 */
function QualityBadge({
  quality,
  isSelected,
  isPremium,
  onPress,
}: {
  quality: string;
  isSelected: boolean;
  isPremium: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const mockService = MockVideoService.getInstance();
  const { label, description } = mockService.getQualityLabel(quality);

  // Check if quality is locked (720p for non-premium)
  const isLocked = quality === "720p" && !isPremium;

  return (
    <Pressable
      onPress={onPress}
      disabled={isLocked}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.8 : isLocked ? 0.6 : 1,
        },
      ]}
      className={cn(
        "flex-1 p-3 rounded-lg border gap-2",
        isSelected
          ? "bg-primary/10 border-primary"
          : "bg-surface border-border"
      )}
    >
      <View className="flex-row items-center justify-between">
        <Text
          className={cn(
            "font-semibold text-sm",
            isSelected ? "text-primary" : "text-foreground"
          )}
        >
          {label}
        </Text>
        {isLocked && (
          <Text className="text-xs font-bold text-warning">🔒</Text>
        )}
      </View>
      <Text className="text-xs text-muted">{description}</Text>
    </Pressable>
  );
}

/**
 * Resolution Details Component
 */
function ResolutionDetails({
  quality,
  video,
}: {
  quality: string;
  video: VideoMetadata;
}) {
  const mockService = MockVideoService.getInstance();
  const fileSize = video.fileSize?.[quality as keyof typeof video.fileSize];
  const resolution = video.resolution?.[quality as keyof typeof video.resolution];

  if (!fileSize) return null;

  return (
    <View className="gap-2 p-3 bg-background/50 rounded-lg border border-border/50">
      <View className="flex-row justify-between">
        <Text className="text-xs text-muted">File Size:</Text>
        <Text className="text-xs font-semibold text-foreground">
          {mockService.formatFileSize(fileSize)}
        </Text>
      </View>
      {resolution && (
        <>
          <View className="flex-row justify-between">
            <Text className="text-xs text-muted">Resolution:</Text>
            <Text className="text-xs font-semibold text-foreground">
              {resolution.width}×{resolution.height}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-muted">Bitrate:</Text>
            <Text className="text-xs font-semibold text-foreground">
              {resolution.bitrate}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

/**
 * Video Preview Card Component
 */
export function VideoPreviewCard({
  video,
  selectedQuality = "480p",
  onQualitySelect,
  isPremium = false,
  onDownload,
}: VideoPreviewCardProps) {
  const colors = useColors();
  const mockService = MockVideoService.getInstance();

  const videoInfo = useMemo(() => {
    return {
      duration: mockService.formatDuration(video.duration),
      availableQualities: Object.keys(video.fileSize || {}) as string[],
    };
  }, [video, mockService]);

  return (
    <ScrollView
      className="w-full"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: 16 }}
    >
      {/* Thumbnail */}
      <View className="w-full rounded-lg overflow-hidden bg-muted/20 aspect-video">
        {video.thumbnail ? (
          <Image
            source={{ uri: video.thumbnail }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center bg-muted/30">
            <Text className="text-muted text-sm">No thumbnail available</Text>
          </View>
        )}

        {/* Duration Badge */}
        <View className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded">
          <Text className="text-white text-xs font-semibold">
            {videoInfo.duration}
          </Text>
        </View>
      </View>

      {/* Video Title */}
      <View className="gap-2">
        <Text className="text-lg font-bold text-foreground">{video.title}</Text>
        <Text className="text-sm text-muted">
          {videoInfo.availableQualities.length} quality options available
        </Text>
      </View>

      {/* Quality Selection */}
      <View className="gap-3">
        <Text className="text-sm font-semibold text-foreground">
          Select Quality
        </Text>

        {/* Quality Badges */}
        <View className="flex-row gap-2">
          {videoInfo.availableQualities.map((quality) => (
            <QualityBadge
              key={quality}
              quality={quality}
              isSelected={selectedQuality === quality}
              isPremium={isPremium}
              onPress={() => {
                // Check if quality is locked
                if (quality === "720p" && !isPremium) {
                  return; // Don't select locked quality
                }
                onQualitySelect?.(quality);
              }}
            />
          ))}
        </View>

        {/* Premium Lock Message */}
        {!isPremium && (
          <View className="bg-warning/10 border border-warning/30 rounded-lg p-3 gap-1">
            <Text className="text-xs font-semibold text-warning">
              🔒 720p HD Locked
            </Text>
            <Text className="text-xs text-warning/80">
              Upgrade to Premium to download in 720p HD quality
            </Text>
          </View>
        )}
      </View>

      {/* Resolution Details */}
      <ResolutionDetails quality={selectedQuality} video={video} />

      {/* Video Stats */}
      <View className="gap-2 p-3 bg-surface rounded-lg border border-border">
        <Text className="text-xs font-semibold text-foreground mb-1">
          Video Information
        </Text>
        <View className="gap-2">
          <View className="flex-row justify-between">
            <Text className="text-xs text-muted">Duration:</Text>
            <Text className="text-xs font-medium text-foreground">
              {videoInfo.duration}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-muted">Format:</Text>
            <Text className="text-xs font-medium text-foreground">MP4</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-muted">Video ID:</Text>
            <Text className="text-xs font-medium text-foreground font-mono">
              {video.id.substring(0, 12)}...
            </Text>
          </View>
        </View>
      </View>

      {/* Download Button */}
      {onDownload && (
        <Pressable
          onPress={() => onDownload(selectedQuality)}
          className="w-full py-3 rounded-lg bg-primary items-center justify-center"
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
        >
          <Text className="text-white font-bold text-base">
            Download {selectedQuality}
          </Text>
        </Pressable>
      )}

      {/* Info Box */}
      <View className="bg-primary/5 border border-primary/20 rounded-lg p-3 gap-2">
        <Text className="text-xs font-semibold text-primary">ℹ️ About Downloads</Text>
        <Text className="text-xs text-primary/80 leading-relaxed">
          Videos are saved to your device storage. You can view them in the History tab.
          {!isPremium && " Upgrade to Premium for faster downloads and 720p quality."}
        </Text>
      </View>
    </ScrollView>
  );
}

export default VideoPreviewCard;
