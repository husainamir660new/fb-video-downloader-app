/**
 * Settings Screen - App Settings & Preferences
 * Clean, production-ready implementation
 */

import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getUserPreferences, updateUserPreferences, getReferralData } from "@/lib/storage";
import { UserPreferences, ReferralData } from "@/lib/types";

export default function SettingsScreen() {
  const colors = useColors();

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [showFAQ, setShowFAQ] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const prefs = await getUserPreferences();
      const referral = await getReferralData();
      setPreferences(prefs);
      setReferralData(referral);
    } catch {
      // Silently fail - settings will use defaults
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (preferences) {
      const updated = { ...preferences, notificationsEnabled: value };
      setPreferences(updated);
      await updateUserPreferences(updated);
    }
  };

  const handleCopyReferralCode = async () => {
    if (referralData?.referralCode) {
      try {
        await Clipboard.setStringAsync(referralData.referralCode);
        Alert.alert("Copied", "Referral code copied to clipboard!");
      } catch {
        Alert.alert("Error", "Failed to copy referral code");
      }
    }
  };

  const handleShareReferralCode = () => {
    if (referralData?.referralCode) {
      Alert.alert(
        "Share Referral Code",
        `Share this code with friends: ${referralData.referralCode}`,
        [
          { text: "Copy", onPress: handleCopyReferralCode },
          { text: "Close", onPress: () => {} },
        ]
      );
    }
  };

  const handleContactSupport = async () => {
    try {
      await Linking.openURL('mailto:Hussainihussain222@gmail.com?subject=FB Video Downloader Support Request');
    } catch (error) {
      Alert.alert('Error', 'Could not open email client');
    }
  };

  const handleOpenPrivacyPolicy = async () => {
    try {
      await Linking.openURL('https://husainamir660new.github.io/privacy-policy/' );
    } catch (error) {
      Alert.alert('Error', 'Could not open Privacy Policy');
    }
  };

  const handleOpenTerms = async () => {
    try {
      await Linking.openURL('https://husainamir660new.github.io/privacy-policy/terms.html' );
    } catch (error) {
      Alert.alert('Error', 'Could not open Terms & Conditions');
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 gap-6 p-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Settings</Text>
            <Text className="text-sm text-muted">Manage your preferences</Text>
          </View>

          {/* Notifications Section */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground uppercase">Notifications</Text>
            <View className="bg-surface rounded-lg p-4 border border-border flex-row items-center justify-between">
              <View className="flex-1 gap-1">
                <Text className="font-semibold text-foreground">Push Notifications</Text>
                <Text className="text-xs text-muted">Get notified about downloads</Text>
              </View>
              <Switch
                value={preferences?.notificationsEnabled ?? true}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>

          {/* Referral Section */}
          {referralData && (
            <View className="gap-3">
              <Text className="text-sm font-semibold text-foreground uppercase">Referral</Text>
              <View className="bg-surface rounded-lg p-4 border border-border gap-3">
                <View className="gap-1">
                  <Text className="font-semibold text-foreground">Referral Code</Text>
                  <Text className="text-xs text-muted">
                    Share with friends to earn rewards
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <View className="flex-1 bg-background rounded-lg p-3 border border-border">
                    <Text className="font-mono text-sm text-foreground">
                      {referralData.referralCode}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleCopyReferralCode}
                    className="bg-primary rounded-lg p-3 items-center justify-center"
                  >
                    <MaterialIcons name="content-copy" size={20} color="white" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={handleShareReferralCode}
                  className="bg-primary/10 rounded-lg p-3 items-center"
                >
                  <Text className="font-semibold text-primary">Share Referral Code</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* About Section */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground uppercase">About</Text>
            <View className="bg-surface rounded-lg p-4 border border-border gap-3">
              <View className="flex-row items-center justify-between py-2 border-b border-border">
                <Text className="text-sm text-muted">App Version</Text>
                <Text className="font-semibold text-foreground">1.0.0</Text>
              </View>
              <View className="flex-row items-center justify-between py-2 border-b border-border">
                <Text className="text-sm text-muted">Build</Text>
                <Text className="font-semibold text-foreground">1</Text>
              </View>
              <View className="gap-2 pt-2">
                <Text className="text-xs font-semibold text-warning">⚠️ Copyright Disclaimer</Text>
                <Text className="text-xs text-muted leading-relaxed">
                  This app is not affiliated with Facebook/Meta. Users are solely responsible for respecting copyright laws and intellectual property rights when downloading videos. The developer is not liable for any misuse of this application.
                </Text>
              </View>
            </View>
          </View>

          {/* Help Section */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground uppercase">Help</Text>
            <TouchableOpacity 
              onPress={() => setShowFAQ(true)}
              className="bg-surface rounded-lg p-4 border border-border flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="help" size={24} color={colors.primary} />
                <Text className="font-semibold text-foreground">FAQ</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleContactSupport}
              className="bg-surface rounded-lg p-4 border border-border flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="mail" size={24} color={colors.primary} />
                <Text className="font-semibold text-foreground">Contact Support</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Legal Section */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground uppercase">Legal</Text>
            <TouchableOpacity 
              onPress={handleOpenPrivacyPolicy}
              className="bg-surface rounded-lg p-4 border border-border flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="privacy-tip" size={24} color={colors.primary} />
                <Text className="font-semibold text-foreground">Privacy Policy</Text>
              </View>
              <MaterialIcons name="open-in-new" size={20} color={colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleOpenTerms}
              className="bg-surface rounded-lg p-4 border border-border flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="description" size={24} color={colors.primary} />
                <Text className="font-semibold text-foreground">Terms & Conditions</Text>
              </View>
              <MaterialIcons name="open-in-new" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* FAQ Modal */}
      <Modal
        visible={showFAQ}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowFAQ(false)}
      >
        <ScreenContainer className="bg-background">
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
            <View className="flex-1 gap-4 p-6">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-3xl font-bold text-foreground">FAQ</Text>
                <TouchableOpacity onPress={() => setShowFAQ(false)}>
                  <MaterialIcons name="close" size={28} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              {/* FAQ Items */}
              <View className="gap-4">
                {/* Q1 */}
                <View className="bg-surface rounded-lg p-4 border border-border gap-2">
                  <Text className="font-bold text-foreground text-base">❓ How do I download a video?</Text>
                  <Text className="text-sm text-muted leading-relaxed">
                    1. Copy a Facebook video URL{"\n"}
                    2. Paste it in the app or use the clipboard button{"\n"}
                    3. Click "Extract Video Info"{"\n"}
                    4. Select your preferred quality (360p, 480p, or 720p){"\n"}
                    5. Click "Download Video" and wait for completion
                  </Text>
                </View>

                {/* Q2 */}
                <View className="bg-surface rounded-lg p-4 border border-border gap-2">
                  <Text className="font-bold text-foreground text-base">📱 What video formats are supported?</Text>
                  <Text className="text-sm text-muted leading-relaxed">
                    We support downloading videos from Facebook in MP4 format with multiple quality options:{"\n"}
                    • 360p - Low quality, small file size{"\n"}
                    • 480p - Medium quality, medium file size{"\n"}
                    • 720p - High quality, larger file size
                  </Text>
                </View>

                {/* Q3 */}
                <View className="bg-surface rounded-lg p-4 border border-border gap-2">
                  <Text className="font-bold text-foreground text-base">⏱️ Why is the download slow?</Text>
                  <Text className="text-sm text-muted leading-relaxed">
                    Download speed depends on:{"\n"}
                    • Your internet connection speed{"\n"}
                    • Video quality selected{"\n"}
                    • Server availability{"\n"}
                    {"\n"}Higher quality videos (720p) will take longer to download.
                  </Text>
                </View>

                {/* Q4 */}
                <View className="bg-surface rounded-lg p-4 border border-border gap-2">
                  <Text className="font-bold text-foreground text-base">📁 Where are downloaded videos saved?</Text>
                  <Text className="text-sm text-muted leading-relaxed">
                    Videos are automatically saved to your device's gallery in the "FB Video Downloader" folder, organized by quality (360p, 480p, 720p).
                  </Text>
                </View>

                {/* Q5 */}
                <View className="bg-surface rounded-lg p-4 border border-border gap-2">
                  <Text className="font-bold text-foreground text-base">⚖️ Is it legal to download videos?</Text>
                  <Text className="text-sm text-muted leading-relaxed">
                    You are responsible for ensuring that you have the right to download and use the videos. Always respect copyright laws and the rights of content creators. Do not download copyrighted content without permission.
                  </Text>
                </View>

                {/* Q6 */}
                <View className="bg-surface rounded-lg p-4 border border-border gap-2">
                  <Text className="font-bold text-foreground text-base">🔄 How do I view my download history?</Text>
                  <Text className="text-sm text-muted leading-relaxed">
                    Tap the "History" tab at the bottom of the app to see all your previously downloaded videos with their details, quality, and download date.
                  </Text>
                </View>

                {/* Q7 */}
                <View className="bg-surface rounded-lg p-4 border border-border gap-2">
                  <Text className="font-bold text-foreground text-base">🗑️ How do I delete a downloaded video?</Text>
                  <Text className="text-sm text-muted leading-relaxed">
                    Go to the History tab, find the video you want to delete, and tap the trash icon. The video will be removed from your device.
                  </Text>
                </View>

                {/* Q8 */}
                <View className="bg-surface rounded-lg p-4 border border-border gap-2">
                  <Text className="font-bold text-foreground text-base">❌ The app won't download my video. What should I do?</Text>
                  <Text className="text-sm text-muted leading-relaxed">
                    Try these steps:{"\n"}
                    1. Check your internet connection{"\n"}
                    2. Make sure the Facebook URL is correct{"\n"}
                    3. Try a different video{"\n"}
                    4. Restart the app{"\n"}
                    5. Contact support if the problem persists
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </ScreenContainer>
      </Modal>
    </ScreenContainer>
  );
}
