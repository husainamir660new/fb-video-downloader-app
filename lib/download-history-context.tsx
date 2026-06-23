/**
 * Download History Context
 * Manages downloaded videos history with AsyncStorage persistence
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface DownloadedVideo {
  id: string;
  title: string;
  url: string;
  quality: "360p" | "480p" | "720p";
  fileUri: string;
  thumbnail?: string;
  author?: string;
  duration: number;
  downloadedAt: number; // timestamp
  fileSize?: number;
}

interface DownloadHistoryContextType {
  downloads: DownloadedVideo[];
  addDownload: (video: DownloadedVideo) => Promise<void>;
  removeDownload: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  loadHistory: () => Promise<void>;
  getDownloadById: (id: string) => DownloadedVideo | undefined;
}

const DownloadHistoryContext = createContext<DownloadHistoryContextType | undefined>(
  undefined
);

const STORAGE_KEY = "@fb_video_downloader/download_history";

type DownloadHistoryAction =
  | { type: "SET_DOWNLOADS"; payload: DownloadedVideo[] }
  | { type: "ADD_DOWNLOAD"; payload: DownloadedVideo }
  | { type: "REMOVE_DOWNLOAD"; payload: string }
  | { type: "CLEAR_HISTORY" };

function downloadHistoryReducer(
  state: DownloadedVideo[],
  action: DownloadHistoryAction
): DownloadedVideo[] {
  switch (action.type) {
    case "SET_DOWNLOADS":
      return action.payload;
    case "ADD_DOWNLOAD":
      // Add to beginning of list (most recent first)
      return [action.payload, ...state];
    case "REMOVE_DOWNLOAD":
      return state.filter((d) => d.id !== action.payload);
    case "CLEAR_HISTORY":
      return [];
    default:
      return state;
  }
}

export function DownloadHistoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [downloads, dispatch] = useReducer(downloadHistoryReducer, []);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load history from AsyncStorage on mount
  useEffect(() => {
    loadHistoryFromStorage();
  }, []);

  const loadHistoryFromStorage = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const downloads: DownloadedVideo[] = JSON.parse(data);
        dispatch({ type: "SET_DOWNLOADS", payload: downloads });
      }
    } catch (error) {
      console.error("Failed to load download history:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveHistoryToStorage = useCallback(
    async (downloads: DownloadedVideo[]) => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(downloads));
      } catch (error) {
        console.error("Failed to save download history:", error);
      }
    },
    []
  );

  const addDownload = useCallback(
    async (video: DownloadedVideo) => {
      dispatch({ type: "ADD_DOWNLOAD", payload: video });
      const newDownloads = [video, ...downloads];
      await saveHistoryToStorage(newDownloads);
    },
    [downloads, saveHistoryToStorage]
  );

  const removeDownload = useCallback(
    async (id: string) => {
      dispatch({ type: "REMOVE_DOWNLOAD", payload: id });
      const newDownloads = downloads.filter((d) => d.id !== id);
      await saveHistoryToStorage(newDownloads);
    },
    [downloads, saveHistoryToStorage]
  );

  const clearHistory = useCallback(async () => {
    dispatch({ type: "CLEAR_HISTORY" });
    await saveHistoryToStorage([]);
  }, [saveHistoryToStorage]);

  const loadHistory = useCallback(async () => {
    await loadHistoryFromStorage();
  }, [loadHistoryFromStorage]);

  const getDownloadById = useCallback(
    (id: string) => {
      return downloads.find((d) => d.id === id);
    },
    [downloads]
  );

  const value: DownloadHistoryContextType = {
    downloads,
    addDownload,
    removeDownload,
    clearHistory,
    loadHistory,
    getDownloadById,
  };

  if (!isLoaded) {
    return null; // Or return a loading screen
  }

  return (
    <DownloadHistoryContext.Provider value={value}>
      {children}
    </DownloadHistoryContext.Provider>
  );
}

export function useDownloadHistory() {
  const context = useContext(DownloadHistoryContext);
  if (context === undefined) {
    // Return safe default
    return {
      downloads: [],
      addDownload: async () => {},
      removeDownload: async () => {},
      clearHistory: async () => {},
      loadHistory: async () => {},
      getDownloadById: () => undefined,
    };
  }
  return context;
}
