/**
 * Premium Context
 * Manages in-app purchases and premium subscription status
 * Uses RevenueCat for cross-platform IAP management
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type PremiumTier = "free" | "premium" | "pro";

export interface PremiumStatus {
  tier: PremiumTier;
  isActive: boolean;
  expiresAt: number | null;
  maxQuality: "360p" | "480p" | "720p";
  unlimitedDownloads: boolean;
  adFree: boolean;
}

interface PremiumContextType {
  status: PremiumStatus;
  isPremium: boolean;
  canDownload720p: boolean;
  setPremiumStatus: (status: PremiumStatus) => Promise<void>;
  upgradeToPremium: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  loadPremiumStatus: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

const STORAGE_KEY = "@fb_video_downloader/premium_status";

const DEFAULT_FREE_STATUS: PremiumStatus = {
  tier: "free",
  isActive: true,
  expiresAt: null,
  maxQuality: "480p",
  unlimitedDownloads: false,
  adFree: false,
};

const DEFAULT_PREMIUM_STATUS: PremiumStatus = {
  tier: "premium",
  isActive: true,
  expiresAt: null,
  maxQuality: "720p",
  unlimitedDownloads: true,
  adFree: true,
};

type PremiumAction =
  | { type: "SET_STATUS"; payload: PremiumStatus }
  | { type: "UPGRADE_TO_PREMIUM" }
  | { type: "DOWNGRADE_TO_FREE" }
  | { type: "RESTORE_PURCHASES" };

function premiumReducer(state: PremiumStatus, action: PremiumAction): PremiumStatus {
  switch (action.type) {
    case "SET_STATUS":
      return action.payload;
    case "UPGRADE_TO_PREMIUM":
      return {
        ...DEFAULT_PREMIUM_STATUS,
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
      };
    case "DOWNGRADE_TO_FREE":
      return DEFAULT_FREE_STATUS;
    case "RESTORE_PURCHASES":
      // TODO: Implement RevenueCat restore logic
      return state;
    default:
      return state;
  }
}

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [status, dispatch] = useReducer(premiumReducer, DEFAULT_FREE_STATUS);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load premium status from AsyncStorage on mount
  useEffect(() => {
    loadPremiumStatusFromStorage();
  }, []);

  const loadPremiumStatusFromStorage = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const savedStatus: PremiumStatus = JSON.parse(data);
        
        // Check if subscription has expired
        if (savedStatus.expiresAt && savedStatus.expiresAt < Date.now()) {
          // Subscription expired, downgrade to free
          dispatch({ type: "DOWNGRADE_TO_FREE" });
        } else {
          dispatch({ type: "SET_STATUS", payload: savedStatus });
        }
      }
    } catch (error) {
      console.error("Failed to load premium status:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const savePremiumStatusToStorage = useCallback(async (newStatus: PremiumStatus) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newStatus));
    } catch (error) {
      console.error("Failed to save premium status:", error);
    }
  }, []);

  const setPremiumStatus = useCallback(
    async (newStatus: PremiumStatus) => {
      dispatch({ type: "SET_STATUS", payload: newStatus });
      await savePremiumStatusToStorage(newStatus);
    },
    [savePremiumStatusToStorage]
  );

  const upgradeToPremium = useCallback(async () => {
    /**
     * TODO: Integrate with RevenueCat
     * 
     * Example implementation:
     * 
     * try {
     *   const offerings = await Purchases.getOfferings();
     *   const package = offerings.current?.getPackage("premium_monthly");
     *   
     *   if (package) {
     *     const purchaserInfo = await Purchases.purchasePackage(package);
     *     
     *     if (purchaserInfo.entitlements.active["premium"]) {
     *       const newStatus: PremiumStatus = {
     *         ...DEFAULT_PREMIUM_STATUS,
     *         expiresAt: purchaserInfo.expirationDates["premium"],
     *       };
     *       await setPremiumStatus(newStatus);
     *     }
     *   }
     * } catch (error) {
     *   console.error("Failed to upgrade to premium:", error);
     *   throw error;
     * }
     */
    
    // Mock implementation for now
    dispatch({ type: "UPGRADE_TO_PREMIUM" });
    const newStatus: PremiumStatus = {
      ...DEFAULT_PREMIUM_STATUS,
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    };
    await savePremiumStatusToStorage(newStatus);
  }, [savePremiumStatusToStorage]);

  const restorePurchases = useCallback(async () => {
    /**
     * TODO: Integrate with RevenueCat
     * 
     * Example implementation:
     * 
     * try {
     *   const purchaserInfo = await Purchases.restorePurchases();
     *   
     *   if (purchaserInfo.entitlements.active["premium"]) {
     *     const newStatus: PremiumStatus = {
     *       ...DEFAULT_PREMIUM_STATUS,
     *       expiresAt: purchaserInfo.expirationDates["premium"],
     *     };
     *     await setPremiumStatus(newStatus);
     *   } else {
     *     await setPremiumStatus(DEFAULT_FREE_STATUS);
     *   }
     * } catch (error) {
     *   console.error("Failed to restore purchases:", error);
     *   throw error;
     * }
     */
    
    // Mock implementation for now
    console.log("Restore purchases called - implement RevenueCat integration");
  }, []);

  const loadPremiumStatus = useCallback(async () => {
    await loadPremiumStatusFromStorage();
  }, [loadPremiumStatusFromStorage]);

  const value: PremiumContextType = {
    status,
    isPremium: status.tier !== "free" && status.isActive,
    canDownload720p: status.maxQuality === "720p",
    setPremiumStatus,
    upgradeToPremium,
    restorePurchases,
    loadPremiumStatus,
  };

  if (!isLoaded) {
    return null; // Or return a loading screen
  }

  return (
    <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    // Return safe default
    return {
      status: DEFAULT_FREE_STATUS,
      isPremium: false,
      canDownload720p: false,
      setPremiumStatus: async () => {},
      upgradeToPremium: async () => {},
      restorePurchases: async () => {},
      loadPremiumStatus: async () => {},
    };
  }
  return context;
}
