import React, { createContext, useContext, ReactNode } from "react";

interface AnalyticsContextType {
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
  trackScreen: (screenName: string) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    // Firebase Analytics would be integrated here
    console.log(`[Analytics] Event: ${eventName}`, properties);
  };

  const trackScreen = (screenName: string) => {
    // Firebase Analytics would be integrated here
    console.log(`[Analytics] Screen: ${screenName}`);
  };

  return (
    <AnalyticsContext.Provider value={{ trackEvent, trackScreen }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    return {
      trackEvent: (eventName: string, properties?: Record<string, any>) => {
        console.log(`[Analytics] Event: ${eventName}`, properties);
      },
      trackScreen: (screenName: string) => {
        console.log(`[Analytics] Screen: ${screenName}`);
      },
    };
  }
  return context;
}
