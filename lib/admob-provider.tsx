import React, { ReactNode } from "react";

interface AdMobProviderProps {
  children: ReactNode;
}

/**
 * AdMob Provider - Simple wrapper for AdMob functionality
 * Wraps the app to enable ad serving across all screens
 * 
 * Note: Google Mobile Ads SDK is initialized automatically by the native module
 */
export function AdMobProvider({ children }: AdMobProviderProps) {
  return <>{children}</>;
}
