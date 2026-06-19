# FB Video Downloader Pro - Design Document

## Overview

**FB Video Downloader Pro** is a mobile application that enables users to download Facebook videos in multiple quality options (720p, 480p, 360p) with a seamless, modern interface. The app features AdMob monetization, a premium subscription tier, dark/light mode support, and engagement-driving features like download history, referral system, and push notifications.

**Design Philosophy:** Clean, minimal interface optimized for one-handed usage on portrait orientation (9:16). Follows iOS Human Interface Guidelines with smooth interactions and clear visual hierarchy.

---

## Screen List

| Screen | Purpose | Key Content |
|--------|---------|------------|
| **Home** | Main entry point | URL input field, paste button, recent downloads, banner ad |
| **Download** | Video details & quality selection | Thumbnail, title, duration, quality options (720p/480p/360p), download button |
| **Downloading** | Progress tracking | Video preview, progress bar, download speed, ETA, cancel button |
| **History** | Past downloads | List of downloaded videos with timestamps, delete options |
| **Premium** | Subscription info | Premium benefits, pricing, subscribe button, current plan status |
| **Settings** | App configuration | Theme toggle, notification settings, referral code, about section |
| **Referral** | Growth feature | Unique referral link, invite count, earned rewards, share button |

---

## Primary Content & Functionality

### Home Screen

**Content:**
- Header with app logo and settings icon
- Large URL input field with placeholder "Paste Facebook video URL"
- "Paste from Clipboard" button (auto-detects clipboard on load)
- "Recent Downloads" section showing 3-4 latest videos as horizontal cards
- Banner ad (AdMob) at bottom
- Tab bar with Home, History, Premium, Settings

**Functionality:**
- Auto-detect clipboard link on screen load
- Validate Facebook URL format
- Show error toast if URL is invalid
- Navigate to Download screen on valid URL
- Tap recent video to re-download or view details

### Download Screen

**Content:**
- Video thumbnail (16:9 aspect ratio)
- Video title and duration
- Quality selection cards (720p Premium, 480p, 360p)
- Download button (primary CTA)
- Share button
- Back button

**Functionality:**
- Display video metadata (title, duration, thumbnail)
- Show quality options with file size estimates
- 720p locked for non-premium users (tap to show "Upgrade" sheet)
- Tapping 720p shows rewarded ad option (watch ad to unlock)
- Download button triggers download flow

### Downloading Screen

**Content:**
- Video preview (thumbnail + title)
- Large progress bar with percentage
- Download speed (e.g., "2.5 MB/s")
- Estimated time remaining
- Cancel button
- Interstitial ad appears after download completes (AdMob)

**Functionality:**
- Real-time progress updates
- Cancel download with confirmation
- Save to device storage
- Show success toast and navigate to History
- Track download in history database

### History Screen

**Content:**
- List of downloaded videos
- Each item shows: thumbnail, title, date, file size, delete button
- Empty state message if no downloads
- Pull-to-refresh gesture

**Functionality:**
- Display all downloaded videos sorted by date (newest first)
- Delete individual videos
- Tap to view video details or re-download
- Pull-to-refresh to reload list

### Premium Screen

**Content:**
- Hero section with premium badge
- List of benefits (HD downloads, no ads, faster speed, unlimited downloads)
- Pricing card (monthly/yearly options)
- Subscribe button
- Current plan status (if user is premium)
- Restore purchases button

**Functionality:**
- Display premium features and pricing
- In-app purchase integration
- Show current subscription status
- Restore previous purchases

### Settings Screen

**Content:**
- Theme toggle (Light/Dark/Auto)
- Notification toggle
- Referral section with unique code
- About section (version, privacy policy, terms)
- Logout button (if user auth is added)

**Functionality:**
- Toggle dark/light mode
- Enable/disable push notifications
- Copy referral code to clipboard
- Open external links (privacy, terms)
- Clear app cache option

### Referral Screen

**Content:**
- Unique referral code (e.g., "REF123ABC")
- "Invite Friends" button
- Referral stats (invites sent, rewards earned)
- Share button (opens system share sheet)
- Reward tier information

**Functionality:**
- Generate unique referral link
- Share via system share sheet
- Track referral count
- Show earned rewards (premium days or ad-free hours)

---

## Key User Flows

### Flow 1: Download a Video (Free User)

1. User opens app → Home screen
2. User pastes Facebook URL (or taps "Paste from Clipboard")
3. App validates URL → navigates to Download screen
4. User sees video thumbnail, title, and quality options
5. User selects 480p or 360p (720p is locked)
6. User taps "Download" → Downloading screen
7. Progress bar updates in real-time
8. Download completes → Success toast
9. Interstitial ad appears (AdMob)
10. User navigates to History screen
11. Downloaded video appears in list

### Flow 2: Unlock 720p with Rewarded Ad

1. User on Download screen sees 720p option locked
2. User taps 720p card
3. "Watch ad to unlock 720p" sheet appears
4. User taps "Watch Ad"
5. Rewarded ad plays
6. Ad completes → 720p unlocked for this download
7. User taps "Download" with 720p selected
8. Download proceeds with 720p quality

### Flow 3: Upgrade to Premium

1. User on Download screen or Premium screen
2. User taps "Upgrade to Premium" or "Subscribe"
3. Premium sheet appears with pricing
4. User selects plan (monthly or yearly)
5. In-app purchase flow initiates
6. Payment processed
7. Premium status activated
8. User can now download 720p without ads
9. Banner and interstitial ads hidden
10. Download speed increased

### Flow 4: Share Referral Link

1. User on Settings screen
2. User taps "Referral" section
3. Referral screen opens
4. User taps "Share" button
5. System share sheet appears
6. User selects messaging app or social platform
7. Referral link sent to friend
8. Friend installs app using link
9. Both users get reward (e.g., 3 days premium)

---

## Color Choices

### Light Mode Palette

| Element | Color | Hex |
|---------|-------|-----|
| Background | White | `#FFFFFF` |
| Surface | Light Gray | `#F5F5F5` |
| Foreground (Text) | Dark Gray | `#1A1A1A` |
| Muted Text | Medium Gray | `#666666` |
| Primary (CTA) | Vibrant Blue | `#0066FF` |
| Success | Green | `#22C55E` |
| Error | Red | `#EF4444` |
| Border | Light Gray | `#E5E7EB` |

### Dark Mode Palette

| Element | Color | Hex |
|---------|-------|-----|
| Background | Dark Gray | `#0F0F0F` |
| Surface | Darker Gray | `#1A1A1A` |
| Foreground (Text) | White | `#FFFFFF` |
| Muted Text | Light Gray | `#AAAAAA` |
| Primary (CTA) | Bright Blue | `#3B82F6` |
| Success | Light Green | `#4ADE80` |
| Error | Light Red | `#F87171` |
| Border | Dark Border | `#333333` |

### Brand Identity

- **Primary Color:** Vibrant Blue (`#0066FF` light, `#3B82F6` dark) — conveys trust and reliability
- **Accent:** Bright Green for success states
- **Typography:** San Francisco (iOS) / Roboto (Android) for consistency with platform guidelines

---

## Interaction Patterns

### Press Feedback

- **Buttons:** Scale to 0.97 + haptic feedback (light impact)
- **Cards:** Opacity 0.7 on press
- **Icons:** Opacity 0.6 on press

### Animations

- **Screen Transitions:** Fade in 200ms
- **Progress Bar:** Smooth linear animation
- **Download Complete:** Subtle scale-up (1.0 → 1.05) with success haptic
- **Error Toast:** Slide in from top, 300ms

### Haptic Feedback

- **Button Tap:** Light impact
- **Download Complete:** Success notification
- **Error:** Error notification
- **Referral Share:** Light impact

---

## Accessibility Considerations

- All text meets WCAG AA contrast ratios
- Touch targets minimum 44pt × 44pt
- VoiceOver support for all interactive elements
- Reduced motion support (disable animations if system preference set)
- Clear error messages with actionable suggestions

---

## Technical Notes

- **Platform:** React Native with Expo SDK 54
- **State Management:** React Context + AsyncStorage for local data
- **Backend:** Optional tRPC for analytics and referral tracking
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Video Extraction:** Integration with Facebook video API or third-party service
- **Monetization:** Google AdMob SDK, In-App Purchases (RevenueCat or native)
- **Analytics:** Firebase Analytics for user behavior tracking
- **Push Notifications:** Expo Notifications with Firebase Cloud Messaging

---

## Success Metrics

- **Retention:** 40%+ Day-1 retention, 20%+ Day-7 retention
- **Monetization:** $0.50+ ARPU (average revenue per user)
- **Conversion:** 5%+ free-to-premium conversion rate
- **Referral:** 10%+ of new users from referral program
- **Engagement:** 3+ downloads per active user per week
