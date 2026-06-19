# Firebase Setup Guide

This guide walks you through setting up Firebase Analytics, Crash Reporting, and Performance Monitoring for the FB Video Downloader app.

## Prerequisites

- Google account
- Firebase project (create at https://console.firebase.google.com)
- Expo project configured

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" or "Add project"
3. Enter project name: `fb-video-downloader`
4. Enable Google Analytics (recommended)
5. Click "Create project"

## Step 2: Get Firebase Credentials

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Click on **Service Accounts** tab
3. Click **Generate New Private Key**
4. Save the JSON file securely
5. Go to **General** tab and copy your Web API Key and other credentials

## Step 3: Add Firebase to Your App

### For Web (Development)

1. In Firebase Console, click **Add app** → **Web**
2. Register app with name `fb-video-downloader-web`
3. Copy the Firebase config object
4. Create `.env.local` file in project root:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### For Android

1. In Firebase Console, click **Add app** → **Android**
2. Enter package name: `space.manus.fb.video.downloader`
3. Download `google-services.json`
4. Place in `android/app/google-services.json`
5. Update `app.config.ts` with Firebase plugin

### For iOS

1. In Firebase Console, click **Add app** → **iOS**
2. Enter bundle ID: `space.manus.fb.video.downloader`
3. Download `GoogleService-Info.plist`
4. Place in `ios/GoogleService-Info.plist`
5. Update `app.config.ts` with Firebase plugin

## Step 4: Install Firebase Packages

```bash
pnpm add firebase @react-native-firebase/app @react-native-firebase/analytics @react-native-firebase/crashlytics @react-native-firebase/performance
```

## Step 5: Update app.config.ts

Add Firebase plugin to your `app.config.ts`:

```typescript
plugins: [
  [
    "@react-native-firebase/app",
    {
      android: {
        googleServicesFile: "./google-services.json",
      },
      ios: {
        googleServicesPlistPath: "./GoogleService-Info.plist",
      },
    },
  ],
  "@react-native-firebase/analytics",
  "@react-native-firebase/crashlytics",
  "@react-native-firebase/performance",
],
```

## Step 6: Initialize Firebase in App

Update `app/_layout.tsx`:

```typescript
import { useEffect } from "react";
import { firebaseAnalytics } from "@/lib/firebase-config";

export default function RootLayout() {
  useEffect(() => {
    // Initialize Firebase Analytics
    firebaseAnalytics.trackAppOpen();
  }, []);

  return (
    // ... your layout
  );
}
```

## Step 7: Track Events

Use the `FirebaseAnalyticsService` throughout your app:

```typescript
import { firebaseAnalytics } from "@/lib/firebase-config";

// Track video download
firebaseAnalytics.trackVideoDownload({
  videoId: "video_123",
  quality: "720p",
  fileSize: 52428800, // 50MB
  duration: 300,
});

// Track premium purchase
firebaseAnalytics.trackPremiumConversion({
  userId: "user_123",
  plan: "yearly",
  price: 19.99,
  currency: "USD",
});

// Track ad impression
firebaseAnalytics.trackAdImpression({
  adType: "banner",
  adNetwork: "admob",
  placement: "home_screen",
});

// Track custom event
firebaseAnalytics.trackCustomEvent("custom_event", {
  custom_param: "value",
});
```

## Step 8: Enable Firebase Services

### Analytics

1. Go to Firebase Console → **Analytics**
2. Enable Analytics (should be automatic)
3. Wait 24 hours for data to appear

### Crash Reporting

1. Go to Firebase Console → **Crashlytics**
2. Click **Enable Crashlytics**
3. Crashes will be automatically reported

### Performance Monitoring

1. Go to Firebase Console → **Performance**
2. Click **Enable Performance Monitoring**
3. App performance metrics will be tracked

## Step 9: View Analytics Data

1. Go to Firebase Console → **Analytics** → **Dashboard**
2. View real-time events, user engagement, and retention metrics
3. Use **Events** tab to see specific event data
4. Use **Audience** tab to segment users
5. Use **Conversions** tab to track premium purchases

## Key Events to Track

| Event | Purpose | When to Track |
|-------|---------|---------------|
| `app_open` | User opens app | App launch |
| `video_download` | User downloads video | Download completion |
| `download_error` | Download fails | Error occurs |
| `premium_purchase` | User buys premium | Purchase completes |
| `ad_impression` | Ad is shown | Ad displays |
| `ad_click` | User clicks ad | User taps ad |
| `rewarded_ad_complete` | Rewarded ad completes | Ad finishes |
| `referral_share` | User shares referral code | User shares |
| `screen_view` | User views screen | Screen changes |

## Monitoring Metrics

### User Retention
- Track `app_open` events to measure daily/weekly active users
- Monitor user return rates

### Engagement
- Track `video_download` events to measure feature usage
- Monitor average session duration

### Monetization
- Track `premium_purchase` events for conversion rate
- Track `ad_impression` and `ad_click` for ad revenue

### Crashes
- Monitor Crashlytics dashboard for app crashes
- Set up alerts for critical errors

## Best Practices

1. **Set User IDs** - Use `setUserId()` to track individual users
2. **Add User Properties** - Segment users by plan, region, etc.
3. **Track Errors** - Log errors for debugging
4. **Batch Events** - Firebase batches events automatically
5. **Test Locally** - Use debug mode during development
6. **Monitor Quotas** - Firebase has free tier limits

## Troubleshooting

### Events not appearing in Firebase Console

1. Check that Firebase is initialized properly
2. Wait 24 hours for first data to appear
3. Check browser console for errors
4. Verify Firebase credentials are correct
5. Check Firebase project quota limits

### Crashes not being reported

1. Ensure Crashlytics is enabled in Firebase Console
2. Check that app has internet connection
3. Verify Firebase plugin is installed
4. Check app logs for initialization errors

### Performance metrics not showing

1. Enable Performance Monitoring in Firebase Console
2. Wait 24 hours for data to appear
3. Ensure app is running long enough to collect data
4. Check that Performance plugin is installed

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Analytics Guide](https://firebase.google.com/docs/analytics)
- [Firebase Crashlytics Guide](https://firebase.google.com/docs/crashlytics)
- [Firebase Performance Monitoring](https://firebase.google.com/docs/perf-mod)
- [React Native Firebase](https://rnfirebase.io/)
