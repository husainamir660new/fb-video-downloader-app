/**
 * Download and Premium Context
 * Manages download state, progress, and premium status
 */

import React, { createContext, useContext, useReducer, useCallback } from "react";
import { DownloadProgress, VideoMetadata, UserPreferences } from "./types";
import { getUserPreferences, updateUserPreferences } from "./storage";

interface DownloadContextType {
  // Download state
  currentDownload: DownloadProgress | null;
  videoMetadata: VideoMetadata | null;
  selectedQuality: "720p" | "480p" | "360p";

  // Premium state
  isPremium: boolean;
  premiumExpiresAt: number | null;

  // Actions
  setVideoMetadata: (metadata: VideoMetadata) => void;
  setSelectedQuality: (quality: "720p" | "480p" | "360p") => void;
  startDownload: (videoId: string, totalBytes: number) => void;
  updateProgress: (progress: DownloadProgress) => void;
  completeDownload: () => void;
  failDownload: (error: string) => void;
  clearDownload: () => void;

  // Premium actions
  setPremiumStatus: (isPremium: boolean, expiresAt?: number) => void;
  loadPremiumStatus: () => Promise<void>;
}

const DownloadContext = createContext<DownloadContextType | undefined>(
  undefined
);

type DownloadAction =
  | {
      type: "SET_VIDEO_METADATA";
      payload: VideoMetadata;
    }
  | {
      type: "SET_SELECTED_QUALITY";
      payload: "720p" | "480p" | "360p";
    }
  | {
      type: "START_DOWNLOAD";
      payload: { videoId: string; totalBytes: number };
    }
  | {
      type: "UPDATE_PROGRESS";
      payload: DownloadProgress;
    }
  | {
      type: "COMPLETE_DOWNLOAD";
    }
  | {
      type: "FAIL_DOWNLOAD";
      payload: string;
    }
  | {
      type: "CLEAR_DOWNLOAD";
    }
  | {
      type: "SET_PREMIUM_STATUS";
      payload: { isPremium: boolean; expiresAt?: number };
    };

interface DownloadState {
  currentDownload: DownloadProgress | null;
  videoMetadata: VideoMetadata | null;
  selectedQuality: "720p" | "480p" | "360p";
  isPremium: boolean;
  premiumExpiresAt: number | null;
}

const initialState: DownloadState = {
  currentDownload: null,
  videoMetadata: null,
  selectedQuality: "480p",
  isPremium: false,
  premiumExpiresAt: null,
};

function downloadReducer(
  state: DownloadState,
  action: DownloadAction
): DownloadState {
  switch (action.type) {
    case "SET_VIDEO_METADATA":
      return {
        ...state,
        videoMetadata: action.payload,
      };

    case "SET_SELECTED_QUALITY":
      return {
        ...state,
        selectedQuality: action.payload,
      };

    case "START_DOWNLOAD":
      return {
        ...state,
        currentDownload: {
          videoId: action.payload.videoId,
          progress: 0,
          downloadedBytes: 0,
          totalBytes: action.payload.totalBytes,
          speed: 0,
          eta: 0,
          status: "downloading",
        },
      };

    case "UPDATE_PROGRESS":
      return {
        ...state,
        currentDownload: action.payload,
      };

    case "COMPLETE_DOWNLOAD":
      return {
        ...state,
        currentDownload: state.currentDownload
          ? { ...state.currentDownload, status: "completed", progress: 100 }
          : null,
      };

    case "FAIL_DOWNLOAD":
      return {
        ...state,
        currentDownload: state.currentDownload
          ? {
              ...state.currentDownload,
              status: "failed",
              error: action.payload,
            }
          : null,
      };

    case "CLEAR_DOWNLOAD":
      return {
        ...state,
        currentDownload: null,
        videoMetadata: null,
        selectedQuality: "480p",
      };

    case "SET_PREMIUM_STATUS":
      return {
        ...state,
        isPremium: action.payload.isPremium,
        premiumExpiresAt: action.payload.expiresAt || null,
      };

    default:
      return state;
  }
}

export function DownloadProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(downloadReducer, initialState);

  const setVideoMetadata = useCallback((metadata: VideoMetadata) => {
    dispatch({ type: "SET_VIDEO_METADATA", payload: metadata });
  }, []);

  const setSelectedQuality = useCallback(
    (quality: "720p" | "480p" | "360p") => {
      dispatch({ type: "SET_SELECTED_QUALITY", payload: quality });
    },
    []
  );

  const startDownload = useCallback(
    (videoId: string, totalBytes: number) => {
      dispatch({ type: "START_DOWNLOAD", payload: { videoId, totalBytes } });
    },
    []
  );

  const updateProgress = useCallback((progress: DownloadProgress) => {
    dispatch({ type: "UPDATE_PROGRESS", payload: progress });
  }, []);

  const completeDownload = useCallback(() => {
    dispatch({ type: "COMPLETE_DOWNLOAD" });
  }, []);

  const failDownload = useCallback((error: string) => {
    dispatch({ type: "FAIL_DOWNLOAD", payload: error });
  }, []);

  const clearDownload = useCallback(() => {
    dispatch({ type: "CLEAR_DOWNLOAD" });
  }, []);

  const setPremiumStatus = useCallback(
    (isPremium: boolean, expiresAt?: number) => {
      dispatch({
        type: "SET_PREMIUM_STATUS",
        payload: { isPremium, expiresAt },
      });
    },
    []
  );

  const loadPremiumStatus = useCallback(async () => {
    try {
      const prefs = await getUserPreferences();
      const isPremium =
        prefs.premiumStatus === "premium" &&
        (!prefs.premiumExpiresAt || prefs.premiumExpiresAt > Date.now());

      setPremiumStatus(isPremium, prefs.premiumExpiresAt);
    } catch (error) {
      // Silently fail - premium status will default to false
    }
  }, [setPremiumStatus]);

  const value: DownloadContextType = {
    currentDownload: state.currentDownload,
    videoMetadata: state.videoMetadata,
    selectedQuality: state.selectedQuality,
    isPremium: state.isPremium,
    premiumExpiresAt: state.premiumExpiresAt,
    setVideoMetadata,
    setSelectedQuality,
    startDownload,
    updateProgress,
    completeDownload,
    failDownload,
    clearDownload,
    setPremiumStatus,
    loadPremiumStatus,
  };

  return (
    <DownloadContext.Provider value={value}>
      {children}
    </DownloadContext.Provider>
  );
}

export function useDownload() {
  const context = useContext(DownloadContext);
  if (context === undefined) {
    // Return a safe default object instead of throwing
    // This prevents crashes in edge cases during initialization
    return {
      currentDownload: null,
      videoMetadata: null,
      selectedQuality: "480p" as const,
      isPremium: false,
      premiumExpiresAt: null,
      setVideoMetadata: () => {},
      setSelectedQuality: () => {},
      startDownload: () => {},
      updateProgress: () => {},
      completeDownload: () => {},
      failDownload: () => {},
      clearDownload: () => {},
      setPremiumStatus: () => {},
      loadPremiumStatus: async () => {},
    };
  }
  return context;
}
