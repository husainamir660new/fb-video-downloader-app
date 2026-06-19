# Build and Deploy Guide for Google Play Store

## Prerequisites

Before building and deploying to Google Play Store, ensure you have:

1. **Google Play Developer Account**
   - Visit: https://play.google.com/console
   - Pay $25 registration fee
   - Complete your developer profile

2. **Android Keystore**
   - Generate signing key
   - Store securely
   - Never commit to version control

3. **Expo Account**
   - Visit: https://expo.dev
   - Create account
   - Install Expo CLI: `npm install -g expo-cli`

4. **Node.js & npm**
   - Version 16+ recommended
   - Verify: `node --version` and `npm --version`

5. **Android SDK** (optional, for local builds)
   - Android Studio
   - Android SDK Platform 34+

## Step 1: Generate Signing Key

### Create Android Keystore

```bash
# Navigate to project directory
cd /home/ubuntu/fb_video_downloader

# Generate keystore (one-time only)
keytool -genkey -v -keystore fb-video-downloader.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias fb_video_downloader_key
```

**Important:** Store the keystore file securely and remember the password.

### Configure Keystore in app.config.ts

```typescript
// Add to app.config.ts
const keystoreConfig = {
  keystorePath: "./fb-video-downloader.keystore",
  keystorePassword: process.env.KEYSTORE_PASSWORD,
  keyAlias: "fb_video_downloader_key",
  keyPassword: process.env.KEY_PASSWORD,
};
```

## Step 2: Update App Configuration

### Verify app.config.ts

```typescript
// Ensure these are correct:
- version: "1.0.0"
- versionCode: 1
- android.minSdkVersion: 24
- android.targetSdkVersion: 34
- android.package: "space.manus.fb.video.downloader"
```

### Update Build Properties

```bash
# Set environment variables
export KEYSTORE_PASSWORD="your_keystore_password"
export KEY_PASSWORD="your_key_password"
```

## Step 3: Build APK/AAB

### Option A: Build with Expo Cloud Build (Recommended)

```bash
# Login to Expo
expo login

# Build for Android
eas build --platform android --type apk

# Or build AAB (for Play Store)
eas build --platform android --type app-bundle
```

### Option B: Local Build

```bash
# Install dependencies
pnpm install

# Build APK locally
eas build --platform android --type apk --local
```

## Step 4: Create Play Store Listing

### Access Google Play Console

1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in app details:
   - **App name:** FB Video Downloader Pro
   - **Default language:** English
   - **App or game:** App
   - **Free or paid:** Free

### Complete Store Listing

1. **App details**
   - Title: FB Video Downloader Pro
   - Short description: Download Facebook videos in HD
   - Full description: [See PLAYSTORE_LISTING.md]
   - Category: Tools
   - Content rating: Everyone

2. **Graphics**
   - Icon (512x512): `assets/images/icon.png`
   - Feature graphic (1024x500): [Create custom image]
   - Screenshots (2-8): [Create 5 screenshots]
   - Video preview: [Optional]

3. **Content rating**
   - Complete questionnaire
   - Select "Everyone" rating

4. **Pricing & distribution**
   - Price: Free
   - Countries: All
   - Device categories: Phones and Tablets

## Step 5: Upload Build

### Upload APK/AAB

1. In Play Console, go to "Release" → "Production"
2. Click "Create new release"
3. Upload the APK or AAB file
4. Add release notes:
   ```
   Version 1.0.0 - Initial Release
   
   Features:
   - Download Facebook videos in multiple qualities
   - Fast download speeds with progress tracking
   - Download history management
   - Dark/light mode support
   - Premium subscription
   - No ads for premium users
   ```

### Add Privacy Policy

1. Go to "App content" → "Privacy policy"
2. Add URL: https://yoursite.com/privacy-policy
3. Or paste PRIVACY_POLICY.md content

### Add Terms of Service

1. Go to "App content" → "Terms of service"
2. Add URL: https://yoursite.com/terms
3. Or paste TERMS_OF_SERVICE.md content

## Step 6: Test Before Launch

### Internal Testing

1. Add test devices to internal testing track
2. Share internal test link with testers
3. Gather feedback
4. Fix any issues

### Closed Testing

1. Create closed testing track
2. Add up to 100 testers
3. Run for 1-2 weeks
4. Monitor crash reports

### Open Testing

1. Create open testing track
2. Allow public testing
3. Run for 1-2 weeks
4. Monitor reviews and ratings

## Step 7: Submit for Review

### Final Checklist

- [ ] All permissions justified
- [ ] Privacy policy complete
- [ ] Terms of service complete
- [ ] Content rating accurate
- [ ] Screenshots professional
- [ ] Description compelling
- [ ] No placeholder text
- [ ] All features working
- [ ] No crashes on test devices
- [ ] Performance acceptable
- [ ] Storage usage reasonable
- [ ] Battery usage reasonable

### Submit to Production

1. In Play Console, go to "Release" → "Production"
2. Review all details
3. Click "Review release"
4. Click "Start rollout to Production"
5. Confirm submission

## Step 8: Monitor After Launch

### Track Performance

```
Google Play Console Dashboard:
- Installs and uninstalls
- Active devices
- Crash rate
- ANR rate
- User ratings and reviews
- Revenue (if applicable)
```

### Respond to Reviews

1. Monitor user reviews daily
2. Respond to negative reviews
3. Fix reported issues quickly
4. Release updates regularly

### Monitor Analytics

```
Firebase Console:
- User acquisition
- User retention
- Event tracking
- Crash reports
- Performance metrics
```

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules
pnpm install
eas build --platform android --type apk --clean
```

### APK Won't Install

- Check minimum SDK version
- Verify app signing
- Check device compatibility
- Review error logs

### App Crashes on Launch

- Check Firebase logs
- Review crash reports
- Test on multiple devices
- Check permissions

### Low Ratings

- Fix reported bugs quickly
- Respond to user feedback
- Improve performance
- Add requested features

## Version Updates

### Update to v1.0.1

```typescript
// In app.config.ts
version: "1.0.1",
versionCode: 2,
```

```bash
# Build and upload
eas build --platform android --type app-bundle
```

### Release Notes Template

```
Version 1.0.1 - Bug Fixes

- Fixed crash on Android 8.0
- Improved download speed
- Better error messages
- UI improvements
```

## Security Best Practices

1. **Never commit keystore to git**
   ```bash
   echo "*.keystore" >> .gitignore
   ```

2. **Use environment variables**
   ```bash
   export KEYSTORE_PASSWORD="secure_password"
   export KEY_PASSWORD="secure_password"
   ```

3. **Rotate signing keys annually**
   - Create new keystore
   - Update in Play Console
   - Archive old keystore

4. **Monitor for security issues**
   - Review Play Console alerts
   - Check Firebase security reports
   - Update dependencies regularly

## Performance Optimization

### Reduce APK Size

```bash
# Enable minification
eas build --platform android --type apk --minify
```

### Optimize Images

- Use WebP format
- Compress PNG/JPG
- Remove unused assets
- Use vector graphics

### Monitor Performance

- Check crash rate
- Monitor ANR rate
- Track startup time
- Profile memory usage

## Marketing After Launch

1. **Social Media**
   - Post on Twitter, Facebook, Instagram
   - Share download link
   - Engage with users

2. **Press Release**
   - Send to tech blogs
   - Contact app review sites
   - Reach out to influencers

3. **App Store Optimization (ASO)**
   - Use relevant keywords
   - Optimize description
   - Update screenshots regularly
   - Encourage positive reviews

4. **Paid Promotion**
   - Google App Campaigns
   - Facebook Ads
   - TikTok Ads
   - Influencer partnerships

## Support & Maintenance

### Handle User Issues

1. Monitor reviews and ratings
2. Respond to user feedback
3. Fix bugs quickly
4. Release updates regularly

### Collect Feedback

- In-app feedback form
- Email support
- Social media monitoring
- Analytics review

### Plan Updates

- Monthly bug fixes
- Quarterly feature updates
- Annual major releases
- Security patches as needed

## Resources

- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Expo EAS Build Docs](https://docs.expo.dev/build/setup/)
- [Android App Quality Guidelines](https://developer.android.com/distribute/quality-guidelines)
- [Firebase Documentation](https://firebase.google.com/docs)

## Timeline

| Task | Duration | Status |
|------|----------|--------|
| Generate signing key | 15 min | ⏳ TODO |
| Update app config | 30 min | ⏳ TODO |
| Build APK/AAB | 30-60 min | ⏳ TODO |
| Create Play Store listing | 1-2 hrs | ⏳ TODO |
| Upload build | 15 min | ⏳ TODO |
| Internal testing | 3-5 days | ⏳ TODO |
| Closed testing | 7-14 days | ⏳ TODO |
| Submit for review | 5 min | ⏳ TODO |
| Review approval | 24-48 hrs | ⏳ TODO |
| **TOTAL** | **3-4 weeks** | ⏳ IN PROGRESS |

---

**Ready to launch your app on Google Play Store!**

For questions or issues, refer to the official documentation or contact support.
