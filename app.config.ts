// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

// ---------------------------------------------------------------------------
// Bundle / Package identifiers
// ---------------------------------------------------------------------------
// Reverse-DNS style identifier. Letters, digits and dots only; each
// dot-separated segment must start with a letter on Android.
const rawBundleId = "com.saidhussain.fastdownloader";
const bundleId =
  rawBundleId
    .replace(/[-_]/g, ".")
    .replace(/[^a-zA-Z0-9.]/g, "")
    .replace(/\.+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .toLowerCase()
    .split(".")
    .map((segment) => (/^[a-zA-Z]/.test(segment) ? segment : "x" + segment))
    .join(".") || "space.manus.app";

const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

// ---------------------------------------------------------------------------
// Branding & Google Play Compliance
// ---------------------------------------------------------------------------
const env = {
  appName: "Fast Video Downloader",
  appSlug: "fast-video-downloader",
  logoUrl:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663536195383/FgNVMB3VxiUe2gdY2a9c7N/icon-azsQsYx7dAZdEb6DbyQND9.webp",
  scheme: schemeFromBundleId,
  iosBundleId: "com.saidhussain.fastdownloader",
  androidPackage: "com.saidhussain.fastdownloader",
  // Google Play Store compliance (required for submission )
  privacyPolicyUrl: process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || "https://fbvideodl-fgnvmb3v.manus.space/privacy-policy",
  termsOfServiceUrl: process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL || "https://fbvideodl-fgnvmb3v.manus.space/terms-of-service",
  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL || "support@fbvideodl.app",
  // AdMob App ID
  admobAppId: "ca-app-pub-6519568646843371~4057082503",
};

// ---------------------------------------------------------------------------
// Expo configuration
// ---------------------------------------------------------------------------
const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.0",
  extra: {
    eas: {
      projectId: "a4963734-26d7-440f-80fe-d71cacde633f",
    },
    // Google Play Store metadata
    privacyPolicyUrl: env.privacyPolicyUrl,
    termsOfServiceUrl: env.termsOfServiceUrl,
    supportEmail: env.supportEmail,
    // AdMob App ID (stored in extra for runtime access )
    admobAppId: env.admobAppId,
  },
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,

  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSPhotoLibraryUsageDescription:
        "Allow $(PRODUCT_NAME) to save downloaded videos to your photo library.",
      NSPhotoLibraryAddUsageDescription:
        "Allow $(PRODUCT_NAME) to save downloaded videos to your photo library.",
    },
  },

  android: {
    package: env.androidPackage,
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: [
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE",
      "android.permission.READ_MEDIA_VIDEO",
      "android.permission.READ_MEDIA_IMAGES",
      "android.permission.POST_NOTIFICATIONS",
    ],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: env.scheme, host: "*" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },

  // ✅ Web configuration removed - Android only app

  plugins: [
    "expo-router",
    "expo-font",
    [
      "expo-audio",
      {
        microphonePermission:
          "Allow $(PRODUCT_NAME) to access your microphone.",
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-media-library",
      {
        photosPermission:
          "Allow $(PRODUCT_NAME) to access your photos and videos.",
        savePhotosPermission:
          "Allow $(PRODUCT_NAME) to save downloaded videos to your library.",
        isAccessMediaLocationEnabled: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: { backgroundColor: "#000000" },
      },
    ],
    [
      "react-native-google-mobile-ads",
      {
        androidAppId: env.admobAppId,
        iosAppId: env.admobAppId,
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          minSdkVersion: 24,
          buildToolsVersion: "35.0.0",
          kotlinVersion: "2.2.20",
        },
        ios: {
          deploymentTarget: "15.1",
        },
      },
    ]
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },

  // ✅ Web bundler configuration removed

};

export default config;
