/**
 * AdMob Configuration
 * Centralized ad unit IDs and configuration
 */

export const ADMOB_CONFIG = {
  // App ID
  appId: 'ca-app-pub-6519568646843371~4057082503',

  // Ad Unit IDs
  adUnits: {
    // Banner Ad - Main Screen
    mainBanner: 'ca-app-pub-6519568646843371/5241905732',
    
    // Interstitial Ad - Between Actions
    interstitial: 'ca-app-pub-6519568646843371/3099224050',
  },

  // Test Ad Unit IDs (for testing before going live)
  testAdUnits: {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  },

  // Configuration
  requestOptions: {
    requestNonPersonalizedAdsOnly: false,
    keywords: ['facebook', 'video', 'downloader'],
  },
};

// Use test ads in development
export const isTestMode = __DEV__;

export const getAdUnitId = (adType: 'banner' | 'interstitial') => {
  if (isTestMode) {
    return adType === 'banner' 
      ? ADMOB_CONFIG.testAdUnits.banner 
      : ADMOB_CONFIG.testAdUnits.interstitial;
  }
  return ADMOB_CONFIG.adUnits[adType === 'banner' ? 'mainBanner' : 'interstitial'];
};
