/**
 * History Screen - Download History
 * Displays all downloaded videos with persistence and management
 */

import React, { useCallback } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
} from "react-native";
import { useFocusEffect } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useDownloadHistory } from "@/lib/download-history-context";
import * as FileSystem from "expo-file-system/legacy";

export default function HistoryScreen() {
  const colors = useColors();
  const { downloads, removeDownload, clearHistory, loadHistory } = useDownloadHistory();

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const handleDeleteDownload = (id: string, title: string) => {
    Alert.alert(
      "Delete Download",
      `Are you sure you want to delete "${title}"?`,
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const download = downloads.find((d) => d.id === id);
              if (download) {
                // Delete file from device
                try {
                  await FileSystem.deleteAsync(download.fileUri);
                } catch (error) {
                  console.warn("Failed to delete file:", error);
                }
                // Remove from history
                await removeDownload(id);
              }
            } catch (error) {
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
              // Delete all files
              for (const download of downloads) {
                try {
                  await FileSystem.deleteAsync(download.fileUri);
                } catch (error) {
                  console.warn("Failed to delete file:", error);
                }
              }
              // Clear history
              await clearHistory();
            } catch (error) {
              Alert.alert("Error", "Failed to clear history");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Size unknown";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 gap-4 p-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-2">
            <View className="gap-1">
              <Text className="text-3xl font-bold text-foreground">History</Text>
              <Text className="text-sm text-muted">
                {downloads.length} download{downloads.length !== 1 ? "s" : ""}
              </Text>
            </View>
            {downloads.length > 0 && (
              <TouchableOpacity
                onPress={handleClearAll}
                className="p-2 rounded-lg bg-error/10"
              >
                <MaterialIcons name="delete-sweep" size={24} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>

          {/* Downloads List */}
          {downloads.length > 0 ? (
            <FlatList
              data={downloads}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View className="bg-surface rounded-lg p-4 mb-3 border border-border overflow-hidden">
                  <View className="flex-row gap-3">
                    {/* Thumbnail */}
                    {item.thumbnail ? (
                      <Image
                        source={{ uri: item.thumbnail }}
                        className="w-16 h-16 rounded-lg bg-muted"
                      />
                    ) : (
                      <View className="w-16 h-16 rounded-lg bg-muted items-center justify-center">
                        <MaterialIcons 
                          name="video-library" 
                          size={24} 
                          color={colors.primary} 
                        />
                      </View>
                    )}

                    {/* Info */}
                    <View className="flex-1 gap-1">
                      <Text 
                        className="text-sm font-semibold text-foreground" 
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>
                      <Text className="text-xs text-muted">
                        {item.author || "Unknown author"}
                      </Text>
                      <View className="flex-row gap-2 mt-1">
                        <View className="bg-primary/20 rounded px-2 py-1">
                          <Text className="text-xs font-semibold text-primary">
                            {item.quality}
                          </Text>
                        </View>
                        <Text className="text-xs text-muted">
                          {formatFileSize(item.fileSize)}
                        </Text>
                      </View>
                      <Text className="text-xs text-muted mt-1">
                        {formatDate(item.downloadedAt)}
                      </Text>
                    </View>

                    {/* Delete Button */}
                    <TouchableOpacity
                      onPress={() => handleDeleteDownload(item.id, item.title)}
                      className="p-2 rounded-lg bg-error/10"
                    >
                      <MaterialIcons name="delete" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          ) : (
            <View className="flex-1 items-center justify-center gap-3">
              <MaterialIcons name="history" size={48} color={colors.muted} />
              <Text className="text-lg font-semibold text-foreground">No Downloads Yet</Text>
              <Text className="text-sm text-muted text-center">
                Download Facebook videos from the Home tab to see them here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}