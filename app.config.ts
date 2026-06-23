import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

// ---------------------------------------------------------------------------
// Bundle / Package identifiers
// ---------------------------------------------------------------------------
// Reverse-DNS style identifier. Letters, digits and dots only; each
// dot-separated segment must start with a letter on Android.
const rawBundleId = "space.manus.fb_video_downloader.t20260503055614";
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
  appName: "FB Video Downloader",
  appSlug: "fb_video_downloader",
  logoUrl:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663536195383/FgNVMB3VxiUe2gdY2a9c7N/icon-6c7uwqESghcy4g2d7qJkbv.png",
  scheme: schemeFromBundleId,
  iosBundleId: bundleId,
  androidPackage: bundleId,
  // Google Play Store compliance (required for submission )
  privacyPolicyUrl: process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || "https://fbvideodl-fgnvmb3v.manus.space/privacy-policy",
  termsOfServiceUrl: process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL || "https://fbvideodl-fgnvmb3v.manus.space/terms-of-service",
  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL || "support@fbvideodl.app",
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
      projectId: "e07aa9ad-8898-4d93-b9ca-884ad7f4ab82",
    },
    // Google Play Store metadata
    privacyPolicyUrl: env.privacyPolicyUrl,
    termsOfServiceUrl: env.termsOfServiceUrl,
    supportEmail: env.supportEmail,
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
        "Allow $(PRODUCT_NAME ) to save downloaded videos to your photo library.",
      NSPhotoLibraryAddUsageDescription:
        "Allow $(PRODUCT_NAME) to save downloaded videos to your photo library.",
    },
  },

  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    permissions: [
      "android.permission.INTERNET",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.READ_MEDIA_IMAGES",
      "android.permission.READ_MEDIA_VIDEO",
    ],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },

  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },

  plugins: [
    "expo-router",
    [
      "expo-audio",
      {
        microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone.",
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
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          buildToolsVersion: "35.0.0",
          kotlinVersion: "2.0.21",
        },
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
