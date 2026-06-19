/**
 * History Screen - Download History
 * Clean, production-ready implementation
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getDownloadHistory, deleteDownloadedVideo, clearDownloadHistory } from "@/lib/storage";
import { DownloadedVideo } from "@/lib/types";

export default function HistoryScreen() {
  const colors = useColors();
  const [downloads, setDownloads] = useState<DownloadedVideo[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadDownloads();
    }, [])
  );

  const loadDownloads = async () => {
    try {
      setLoading(true);
      const history = await getDownloadHistory();
      setDownloads(history);
    } catch (err) {
      console.error("Error loading downloads:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDownload = (video: DownloadedVideo) => {
    Alert.alert(
      "Delete Download",
      `Are you sure you want to delete "${video.title}"?`,
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await deleteDownloadedVideo(video.id);
              setDownloads(downloads.filter((d) => d.id !== video.id));
            } catch (err) {
              Alert.alert("Error", "Failed to delete download");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Downloads",
      "This will delete all download history. This action cannot be undone.",
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Clear All",
          onPress: async () => {
            try {
              await clearDownloadHistory();
              setDownloads([]);
            } catch (err) {
              Alert.alert("Error", "Failed to clear history");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const renderDownloadItem = ({ item }: { item: DownloadedVideo }) => (
    <View className="bg-surface rounded-xl p-4 mb-3 border border-border flex-row items-center gap-3">
      <View className="bg-primary/10 rounded-lg p-3">
        <MaterialIcons name="video-library" size={24} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-xs text-muted mt-1">
          {new Date(item.downloadedAt).toLocaleDateString()}
        </Text>
        <Text className="text-xs text-muted">
          {(item.fileSize / (1024 * 1024)).toFixed(2)} MB
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleDeleteDownload(item)}
        className="p-2"
      >
        <MaterialIcons name="delete" size={20} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {/* Header */}
        <View className="mb-6 mt-4">
          <Text className="text-3xl font-bold text-foreground">Download History</Text>
          <Text className="text-sm text-muted mt-1">
            {downloads.length} video{downloads.length !== 1 ? "s" : ""} downloaded
          </Text>
        </View>

        {/* Downloads List */}
        {downloads.length > 0 ? (
          <>
            <FlatList
              data={downloads}
              renderItem={renderDownloadItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              className="mb-4"
            />

            {/* Clear All Button */}
            <TouchableOpacity
              onPress={handleClearAll}
              className="py-3 rounded-xl bg-error/10 flex-row items-center justify-center gap-2 mt-4"
            >
              <MaterialIcons name="delete-sweep" size={20} color={colors.error} />
              <Text className="font-semibold text-error">Clear All History</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* Empty State */
          <View className="flex-1 items-center justify-center py-12">
            <View className="bg-primary/10 rounded-full p-6 mb-4">
              <MaterialIcons name="history" size={48} color={colors.primary} />
            </View>
            <Text className="text-lg font-semibold text-foreground text-center">
              No Downloads Yet
            </Text>
            <Text className="text-sm text-muted text-center mt-2">
              Your download history will appear here
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
