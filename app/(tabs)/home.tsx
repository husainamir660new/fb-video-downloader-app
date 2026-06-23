import { ScrollView, Text, View, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useVideoDownload } from "@/hooks/use-video-download";
import { usePremium } from "@/lib/premium-context";
import { useDownloadHistory } from "@/lib/download-history-context";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";

/**
 * Home Screen
 * Main screen for entering Facebook video URL and downloading
 */
export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { extractVideoMetadata, downloadVideo, loading, progress, error } = useVideoDownload();
  const { canDownload720p } = usePremium();
  const { addDownload } = useDownloadHistory();

  const [videoUrl, setVideoUrl] = useState("");
  const [selectedQuality, setSelectedQuality] = useState<"360p" | "480p" | "720p">("480p");
  const [videoMetadata, setVideoMetadata] = useState<any>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handlePasteUrl = useCallback(async () => {
    // TODO: Implement clipboard paste
    // For now, just use the input value
    if (!videoUrl.trim()) {
      return;
    }

    try {
      setIsExtracting(true);
      const metadata = await extractVideoMetadata(videoUrl);
      if (metadata) {
        setVideoMetadata(metadata);
      }
    } finally {
      setIsExtracting(false);
    }
  }, [videoUrl, extractVideoMetadata]);

  const handleDownload = useCallback(async () => {
    if (!videoUrl || !videoMetadata) {
      return;
    }

    // Check quality restriction
    if (selectedQuality === "720p" && !canDownload720p) {
      router.push("/(tabs)/premium");
      return;
    }

    try {
      const success = await downloadVideo(videoUrl, selectedQuality, (progress) => {
        console.log(`Download progress: ${progress}%`);
      });

      if (success) {
        // Add to history
        await addDownload({
          id: videoMetadata.id,
          title: videoMetadata.title,
          url: videoUrl,
          quality: selectedQuality,
          fileUri: `${require("expo-file-system/legacy").documentDirectory}FB_Video_${Date.now()}_${selectedQuality}.mp4`,
          thumbnail: videoMetadata.thumbnail,
          author: videoMetadata.author,
          duration: videoMetadata.duration,
          downloadedAt: Date.now(),
        });

        // Reset form
        setVideoUrl("");
        setVideoMetadata(null);
        setSelectedQuality("480p");

        // Navigate to history
        router.push("/(tabs)/history");
      }
    } catch (err) {
      console.error("Download failed:", err);
    }
  }, [videoUrl, videoMetadata, selectedQuality, canDownload720p, downloadVideo, addDownload, router]);

  const isDownloading = loading && progress > 0;

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">FB Video Downloader</Text>
            <Text className="text-base text-muted">Download Facebook videos in HD quality</Text>
          </View>

          {/* URL Input Section */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Video URL</Text>
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="link" size={20} color={colors.primary} />
            </View>
            <TextInput
              placeholder="Paste Facebook video URL..."
              value={videoUrl}
              onChangeText={setVideoUrl}
              editable={!isDownloading}
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              placeholderTextColor={colors.muted}
              multiline
            />
            {error && (
              <View className="flex-row items-center gap-2 bg-error/10 rounded-lg p-3">
                <MaterialIcons name="error" size={18} color={colors.error} />
                <Text className="text-error text-sm flex-1">{error}</Text>
              </View>
            )}
          </View>

          {/* Extract Button */}
          <TouchableOpacity
            onPress={handlePasteUrl}
            disabled={isExtracting || isDownloading || !videoUrl.trim()}
            className="bg-primary rounded-lg py-3 items-center justify-center flex-row gap-2"
            style={{
              opacity: isExtracting || isDownloading || !videoUrl.trim() ? 0.6 : 1,
            }}
          >
            {isExtracting ? (
              <ActivityIndicator color="white" />
            ) : (
              <MaterialIcons name="search" size={20} color="white" />
            )}
            <Text className="text-white font-semibold">
              {isExtracting ? "Extracting..." : "Extract Video Info"}
            </Text>
          </TouchableOpacity>

          {/* Video Metadata */}
          {videoMetadata && (
            <View className="bg-surface rounded-lg p-4 border border-border gap-3">
              <Text className="font-semibold text-foreground text-lg" numberOfLines={2}>
                {videoMetadata.title}
              </Text>
              {videoMetadata.author && (
                <Text className="text-sm text-muted">By: {videoMetadata.author}</Text>
              )}
              <Text className="text-sm text-muted">
                Duration: {Math.floor(videoMetadata.duration / 60)}:{String(videoMetadata.duration % 60).padStart(2, "0")}
              </Text>
            </View>
          )}

          {/* Quality Selection */}
          {videoMetadata && (
            <View className="gap-3">
              <Text className="text-sm font-semibold text-foreground">Select Quality</Text>
              <View className="flex-row gap-2 flex-wrap">
                {["360p", "480p", "720p"].map((quality) => {
                  const isPremiumQuality = quality === "720p";
                  const isAvailable = !isPremiumQuality || canDownload720p;

                  return (
                    <TouchableOpacity
                      key={quality}
                      onPress={() => {
                        if (isAvailable) {
                          setSelectedQuality(quality as "360p" | "480p" | "720p");
                        }
                      }}
                      disabled={!isAvailable}
                      className={`px-4 py-2 rounded-full border-2 flex-row items-center gap-2 ${
                        selectedQuality === quality
                          ? "bg-primary border-primary"
                          : isAvailable
                          ? "bg-surface border-border"
                          : "bg-surface border-muted opacity-50"
                      }`}
                    >
                      <Text
                        className={`font-semibold ${
                          selectedQuality === quality ? "text-white" : "text-foreground"
                        }`}
                      >
                        {quality}
                      </Text>
                      {isPremiumQuality && !canDownload720p && (
                        <MaterialIcons name="lock" size={14} color={colors.muted} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Download Progress */}
          {isDownloading && (
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-foreground">Downloading...</Text>
                <Text className="text-sm text-muted">{progress}%</Text>
              </View>
              <View className="h-2 bg-muted rounded-full overflow-hidden">
                <View
                  className="h-full bg-primary"
                  style={{ width: `${progress}%` }}
                />
              </View>
            </View>
          )}

          {/* Download Button */}
          {videoMetadata && !isDownloading && (
            <TouchableOpacity
              onPress={handleDownload}
              disabled={isDownloading}
              className="bg-primary rounded-lg py-4 items-center justify-center flex-row gap-2"
            >
              <MaterialIcons name="download" size={20} color="white" />
              <Text className="text-white font-bold text-lg">Download Video</Text>
            </TouchableOpacity>
          )}

          {/* Info Section */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-3">
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="info" size={20} color={colors.primary} />
              <Text className="font-semibold text-foreground">How to use</Text>
            </View>
            <Text className="text-sm text-muted leading-relaxed">
              1. Copy a Facebook video URL{"\n"}
              2. Paste it above or use the clipboard button{"\n"}
              3. Select your preferred quality{"\n"}
              4. Download to your device
            </Text>
          </View>

          {/* Supported Formats */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Supported Formats</Text>
            <View className="flex-row gap-2 flex-wrap">
              {["360p", "480p", "720p"].map((format) => (
                <View
                  key={format}
                  className="bg-primary/10 rounded-full px-3 py-1"
                >
                  <Text className="text-xs font-semibold text-primary">{format}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
