/**
 * Hook for video extraction with real API integration
 */

import { useCallback, useState } from "react";
import { VideoMetadata } from "@/lib/types";
import { RealVideoExtractionService } from "@/lib/real-video-extractor";

export interface UseVideoExtractionState {
  loading: boolean;
  error: string | null;
  metadata: VideoMetadata | null;
  source: "real" | "mock" | null;
}

export function useVideoExtraction() {
  const [state, setState] = useState<UseVideoExtractionState>({
    loading: false,
    error: null,
    metadata: null,
    source: null,
  });

  const extractionService = RealVideoExtractionService.getInstance();

  const extract = useCallback(async (url: string) => {
    setState({ loading: true, error: null, metadata: null, source: null });

    try {
      const result = await extractionService.extractVideoMetadata(url);

      if (result.success && result.data) {
        setState({
          loading: false,
          error: null,
          metadata: result.data,
          source: result.source,
        });
        return result.data;
      } else {
        setState({
          loading: false,
          error: result.error || "Failed to extract video metadata",
          metadata: null,
          source: result.source,
        });
        return null;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setState({
        loading: false,
        error: errorMessage,
        metadata: null,
        source: null,
      });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      metadata: null,
      source: null,
    });
  }, []);

  return {
    ...state,
    extract,
    reset,
  };
}
