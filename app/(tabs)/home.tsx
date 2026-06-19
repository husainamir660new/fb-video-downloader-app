/**
 * Home Screen - FB Video Downloader
 * Clean, production-ready implementation
 */

import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useDownload } from "@/lib/download-context";
import { validateFacebookUrl, extractVideoId, getDownloadHistory } from "@/lib/storage";
import { DownloadedVideo } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { setVideoMetadata } = useDownload();

  const [url, setUrl] = useState("");
  const [recentDownloads, setRecentDownloads] = useState<DownloadedVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasClipboard, setHasClipboard] = useState(false);

  // Load recent downloads on mount
  useEffect(() => {
    loadRecentDownloads();
    checkClipboard();
  }, []);

  const loadRecentDownloads = async () => {
    try {
      const history = await getDownloadHistory();
      setRecentDownloads(history.slice(0, 3));
    } catch (err) {
      console.error("Error loading recent downloads:", err);
    }
  };

  const checkClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text && validateFacebookUrl(text)) {
        setHasClipboard(true);
      }
    } catch (err) {
      console.error("Error reading clipboard:", err);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text && validateFacebookUrl(text)) {
        setUrl(text);
        setError("");
        setHasClipboard(false);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to read clipboard");
    }
  };

  const handleDownload = async () => {
    if (!url.trim()) {
      setError("Please enter a Facebook video URL");
      return;
    }

    if (!validateFacebookUrl(url)) {
      setError("Invalid Facebook URL. Please check and try again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const videoId = extractVideoId(url);
      if (!videoId) {
        setError("Could not extract video ID from URL");
        setLoading(false);
        return;
      }

      // Set basic metadata
      setVideoMetadata({
        id: videoId,
        title: "Facebook Video",
        duration: 0,
        thumbnail: "",
        url: url,
        fileSize: {
          "720p": 0,
          "480p": 0,
          "360p": 0,
        },
      });

      // Navigate to download screen
      router.push({
        pathname: `/(tabs)/download?videoId=${encodeURIComponent(videoId)}&url=${encodeURIComponent(url)}`,
      });
    } catch (err) {
      setError("Failed to process video. Please try again.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecentVideoPress = (video: DownloadedVideo) => {
    setUrl(video.url);
    router.push({
      pathname: `/(tabs)/download?videoId=${encodeURIComponent(video.videoId)}&url=${encodeURIComponent(video.url)}`,
    });
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {/* Header */}
        <View className="mb-8 mt-4">
          <Text className="text-4xl font-bold text-foreground mb-2">
            FB Video Downloader
          </Text>
          <Text className="text-base text-muted">
            Download Facebook videos in HD quality
          </Text>
        </View>

        {/* URL Input Section */}
        <View className="mb-6 gap-3">
          <Text className="text-sm font-semibold text-foreground">Video URL</Text>
          <View
            className="flex-row items-center bg-surface rounded-2xl px-4 py-3 border border-border"
            style={{ borderColor: colors.border }}
          >
            <MaterialIcons name="link" size={20} color={colors.muted} />
            <TextInput
              placeholder="Paste Facebook video URL..."
              placeholderTextColor={colors.muted}
              value={url}
              onChangeText={(text) => {
                setUrl(text);
                setError("");
              }}
              className="flex-1 ml-3 text-foreground"
              editable={!loading}
            />
          </View>

          {/* Paste from Clipboard Button */}
          {hasClipboard && (
            <TouchableOpacity
              onPress={handlePasteFromClipboard}
              className="flex-row items-center justify-center py-3 rounded-xl bg-primary/10"
              disabled={loading}
            >
              <MaterialIcons name="content-paste" size={18} color={colors.primary} />
              <Text className="ml-2 font-semibold text-primary">
                Paste from Clipboard
              </Text>
            </TouchableOpacity>
          )}

          {/* Error Message */}
          {error ? (
            <View className="bg-error/10 rounded-xl p-3 flex-row items-center gap-2">
              <MaterialIcons name="error" size={18} color={colors.error} />
              <Text className="text-error flex-1 text-sm">{error}</Text>
            </View>
          ) : null}
        </View>

        {/* Download Button */}
        <TouchableOpacity
          onPress={handleDownload}
          disabled={loading || !url.trim()}
          className={cn(
            "py-4 rounded-2xl flex-row items-center justify-center gap-2 mb-8",
            loading || !url.trim()
              ? "bg-primary/50"
              : "bg-primary"
          )}
        >
          {loading ? (
            <>
              <ActivityIndicator color={colors.background} size="small" />
              <Text className="text-lg font-bold text-background">Processing...</Text>
            </>
          ) : (
            <>
              <MaterialIcons name="download" size={24} color={colors.background} />
              <Text className="text-lg font-bold text-background">Download Video</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Recent Downloads Section */}
        {recentDownloads.length > 0 && (
          <View>
            <Text className="text-lg font-bold text-foreground mb-4">
              Recent Downloads
            </Text>
            <View className="gap-3">
              {recentDownloads.map((video) => (
                <TouchableOpacity
                  key={video.id}
                  onPress={() => handleRecentVideoPress(video)}
                  className="bg-surface rounded-xl p-4 flex-row items-center gap-3 border border-border"
                >
                  <View className="bg-primary/10 rounded-lg p-3">
                    <MaterialIcons name="video-library" size={24} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                      {video.title}
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      {new Date(video.downloadedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {recentDownloads.length === 0 && !loading && (
          <View className="flex-1 items-center justify-center py-12">
            <View className="bg-primary/10 rounded-full p-6 mb-4">
              <MaterialIcons name="video-library" size={48} color={colors.primary} />
            </View>
            <Text className="text-lg font-semibold text-foreground text-center">
              No Downloads Yet
            </Text>
            <Text className="text-sm text-muted text-center mt-2">
              Paste a Facebook video URL above to get started
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
