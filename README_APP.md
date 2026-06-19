# FB Video Downloader Pro - Mobile App

A professional React Native mobile application for downloading Facebook videos in multiple quality options (720p, 480p, 360p) with AdMob monetization, premium subscriptions, and referral system.

## Features

### Core Functionality
- **Video Download:** Extract and download Facebook videos in HD quality
- **Multiple Qualities:** Choose between 720p (premium), 480p, and 360p
- **Download History:** View all downloaded videos with metadata
- **Fast Downloads:** Optimized download speeds with progress tracking
- **Local Storage:** Save videos to device storage for offline viewing

### User Experience
- **Modern UI:** Clean, intuitive interface following iOS Human Interface Guidelines
- **Dark/Light Mode:** Automatic theme switching based on system preferences
- **Clipboard Detection:** Auto-detect Facebook URLs from clipboard
- **Real-time Progress:** Live download progress with speed and ETA
- **Error Handling:** Graceful error messages and recovery options

### Monetization
- **AdMob Integration:** Banner, interstitial, and rewarded ads
- **Premium Subscription:** Monthly and yearly plans to remove ads and unlock 720p
- **Rewarded Ads:** Watch ads to unlock 720p quality for single downloads
- **Referral Program:** Earn premium days by inviting friends

### Growth & Analytics
- **Firebase Analytics:** Track user behavior and monetization metrics
- **Push Notifications:** Engage users with timely notifications
- **Referral System:** Viral growth through friend invitations
- **User Retention:** Engagement loops and win-back campaigns

## Project Structure

```
fb_video_downloader/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab navigation
│   │   ├── home.tsx             # Home screen
│   │   ├── download.tsx         # Download screen
│   │   ├── history.tsx          # History screen
│   │   ├── premium.tsx          # Premium screen
│   │   └── settings.tsx         # Settings screen
│   ├── _layout.tsx              # Root layout with providers
│   └── oauth/
│       └── callback.tsx         # OAuth callback
├── lib/
│   ├── types.ts                 # Core TypeScript types
│   ├── storage.ts               # AsyncStorage utilities
│   ├── download-context.tsx     # Download state management
│   ├── download-service.ts      # Video download logic
│   ├── admob-service.ts         # AdMob integration
│   ├── analytics-service.ts     # Firebase Analytics
│   └── utils.ts                 # Utility functions
├── components/
│   ├── screen-container.tsx     # SafeArea wrapper
│   ├── themed-view.tsx          # Theme-aware view
│   └── ui/
│       └── icon-symbol.tsx      # Icon mapping
├── hooks/
│   ├── use-colors.ts            # Theme colors hook
│   ├── use-color-scheme.ts      # Dark/light mode detection
│   └── use-auth.ts              # Authentication hook
├── assets/
│   └── images/
│       ├── icon.png             # App icon
│       ├── splash-icon.png      # Splash screen
│       └── favicon.png          # Web favicon
├── design.md                    # UI/UX design document
├── todo.md                      # Project roadmap
├── MONETIZATION_STRATEGY.md     # Monetization guide
├── app.config.ts                # Expo configuration
├── tailwind.config.js           # Tailwind CSS config
├── theme.config.js              # Theme colors
└── package.json                 # Dependencies
```

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run on iOS
pnpm ios

# Run on Android
pnpm android

# Run on Web
pnpm dev:web
```

### Configuration

1. **Update App Branding** (`app.config.ts`):
   ```typescript
   const env = {
     appName: "FB Video Downloader",
     appSlug: "fb_video_downloader",
     logoUrl: "https://...", // S3 URL of logo
   };
   ```

2. **Configure AdMob** (`lib/admob-service.ts`):
   ```typescript
   const AD_UNIT_IDS = {
     banner: "ca-app-pub-...",
     interstitial: "ca-app-pub-...",
     rewarded: "ca-app-pub-...",
   };
   ```

3. **Setup Firebase** (when implementing):
   - Create Firebase project
   - Add iOS and Android apps
   - Download configuration files
   - Initialize Firebase in app

## Architecture

### State Management
- **React Context:** Download state, premium status
- **AsyncStorage:** Persistent local data (history, preferences)
- **Custom Hooks:** Theme, colors, authentication

### Services
- **DownloadService:** Video extraction and download logic
- **AdMobService:** Ad management and tracking
- **AnalyticsService:** Event tracking and metrics
- **Storage Utilities:** AsyncStorage operations

### UI Components
- **ScreenContainer:** SafeArea wrapper for all screens
- **ThemedView:** Auto theme-aware backgrounds
- **Tab Navigation:** 4-tab bottom navigation

## Key Screens

### Home Screen
- URL input field with paste button
- Auto-detect clipboard on load
- Recent downloads carousel
- Banner ad placement

### Download Screen
- Video thumbnail and metadata
- Quality selection (720p/480p/360p)
- Premium unlock sheet
- Download button

### History Screen
- List of downloaded videos
- Delete individual or all downloads
- Pull-to-refresh
- Empty state message

### Premium Screen
- Feature list with checkmarks
- Pricing tiers (monthly/yearly)
- Subscribe button
- Restore purchases option

### Settings Screen
- Theme toggle (light/dark/auto)
- Notification preferences
- Referral code and sharing
- About section with links

## Monetization Strategy

### Revenue Streams
1. **AdMob (60% of revenue)**
   - Banner ads: $2-$5 CPM
   - Interstitial ads: $3-$8 CPM
   - Rewarded ads: $5-$15 CPM

2. **Premium Subscriptions (40% of revenue)**
   - Monthly: $2.99
   - Yearly: $19.99 (44% discount)

### Conversion Targets
- Free-to-Premium: 5-10%
- Ad Revenue: $0.30-$0.50 ARPU
- Premium Revenue: $0.20-$0.50 ARPU

See `MONETIZATION_STRATEGY.md` for detailed financial projections.

## Analytics Events

### Tracked Events
- `app_open` - App launch
- `video_download` - Video download completion
- `download_error` - Download failure
- `premium_conversion` - Premium purchase
- `ad_impression` - Ad shown
- `ad_click` - Ad clicked
- `referral_share` - Referral code shared
- `screen_view` - Screen navigation

## Testing

### Manual Testing Checklist
- [ ] Download video in all qualities
- [ ] Test premium unlock flow
- [ ] Verify dark/light mode switching
- [ ] Test referral code copying
- [ ] Check download history persistence
- [ ] Test error handling (invalid URL, network error)
- [ ] Verify ad loading and display
- [ ] Test on iOS and Android

### Unit Tests
```bash
pnpm test
```

## Deployment

### App Store (iOS)
1. Create App Store Connect account
2. Configure app in Xcode
3. Build and submit for review
4. Wait for Apple approval

### Google Play (Android)
1. Create Google Play Console account
2. Configure app in Android Studio
3. Build signed APK/AAB
4. Submit for review
5. Wait for Google approval

## Next Steps

1. **Implement Video Extraction API**
   - Integrate with video extraction service
   - Handle various Facebook URL formats
   - Extract metadata and download links

2. **Setup AdMob**
   - Create AdMob account
   - Configure ad units
   - Integrate Google Mobile Ads SDK
   - Test with real ads

3. **Implement In-App Purchases**
   - Setup RevenueCat or native IAP
   - Configure subscription products
   - Implement purchase flow

4. **Firebase Integration**
   - Setup Firebase project
   - Initialize Analytics
   - Configure Cloud Messaging
   - Implement push notifications

5. **Polish & Optimization**
   - Add animations and transitions
   - Optimize performance
   - Implement error recovery
   - Add loading states

## Support & Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [NativeWind (Tailwind for RN)](https://www.nativewind.dev)
- [AdMob Documentation](https://admob.google.com)
- [Firebase Documentation](https://firebase.google.com/docs)

## License

This project is proprietary and confidential.

## Contact

For support or questions, please contact the development team.
