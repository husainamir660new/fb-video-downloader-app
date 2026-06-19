import React, { createContext, useContext, useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { firebaseAnalytics } from "./firebase-config";

interface AnalyticsContextType {
  trackEvent: (eventName: string, eventData?: Record<string, any>) => void;
  trackScreenView: (screenName: string) => void;
  setUserId: (userId: string) => void;
  setUserProperties: (properties: Record<string, string | number | boolean>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

/**
 * Analytics Provider Component
 * Wraps the app to provide analytics tracking capabilities
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const segments = useSegments();

  // Track screen views automatically
  useEffect(() => {
    const screenName = segments.join("/") || "home";
    firebaseAnalytics.trackScreenView(screenName);
  }, [segments]);

  const contextValue: AnalyticsContextType = {
    trackEvent: (eventName, eventData) => {
      firebaseAnalytics.trackCustomEvent(eventName, eventData);
    },
    trackScreenView: (screenName) => {
      firebaseAnalytics.trackScreenView(screenName);
    },
    setUserId: (userId) => {
      firebaseAnalytics.setUserId(userId);
    },
    setUserProperties: (properties) => {
      firebaseAnalytics.setUserProperties(properties);
    },
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

/**
 * Hook to use analytics context
 */
export function useAnalytics(): AnalyticsContextType {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within AnalyticsProvider");
  }
  return context;
}
