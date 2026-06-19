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
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getUserPreferences, updateUserPreferences, getReferralData } from "@/lib/storage";
import { UserPreferences, ReferralData } from "@/lib/types";

export default function SettingsScreen() {
  const colors = useColors();
  const colorScheme = useColorScheme();

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const prefs = await getUserPreferences();
      const referral = await getReferralData();
      setPreferences(prefs);
      setReferralData(referral);
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setLoading(false);
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
      } catch (err) {
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

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {/* Header */}
        <View className="mb-6 mt-4">
          <Text className="text-3xl font-bold text-foreground">Settings</Text>
          <Text className="text-sm text-muted mt-1">Manage your preferences</Text>
        </View>

        {/* Notifications Section */}
        <View className="mb-6">
          <Text className="text-sm font-bold text-foreground mb-3">Notifications</Text>
          <View className="bg-surface rounded-xl p-4 border border-border flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center gap-3">
              <MaterialIcons name="notifications" size={20} color={colors.primary} />
              <View>
                <Text className="font-semibold text-foreground">Push Notifications</Text>
                <Text className="text-xs text-muted mt-1">Get download reminders</Text>
              </View>
            </View>
            {preferences && (
              <Switch
                value={preferences.notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            )}
          </View>
        </View>

        {/* Referral Section */}
        {referralData && (
          <View className="mb-6">
            <Text className="text-sm font-bold text-foreground mb-3">Referral Program</Text>
            <View className="bg-primary/10 rounded-xl p-4 border border-primary/20">
              <View className="flex-row items-center gap-3 mb-4">
                <MaterialIcons name="card-giftcard" size={24} color={colors.primary} />
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">Invite Friends</Text>
                  <Text className="text-xs text-muted mt-1">
                    Earn rewards for each friend who joins
                  </Text>
                </View>
              </View>

              <View className="bg-background rounded-lg p-3 mb-3 flex-row items-center justify-between">
                <Text className="font-mono font-bold text-primary text-lg">
                  {referralData.referralCode}
                </Text>
                <TouchableOpacity onPress={handleCopyReferralCode} className="p-2">
                  <MaterialIcons name="content-copy" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleShareReferralCode}
                className="bg-primary rounded-lg py-3 flex-row items-center justify-center gap-2"
              >
                <MaterialIcons name="share" size={18} color={colors.background} />
                <Text className="font-semibold text-background">Share Code</Text>
              </TouchableOpacity>

              <View className="mt-4 pt-4 border-t border-primary/20">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm text-muted">Friends Invited:</Text>
                  <Text className="font-bold text-foreground">{referralData.friendsInvited}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted">Premium Days Earned:</Text>
                  <Text className="font-bold text-foreground">{referralData.premiumDaysEarned}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* About Section */}
        <View className="mb-6">
          <Text className="text-sm font-bold text-foreground mb-3">About</Text>
          <View className="gap-2">
            <TouchableOpacity className="bg-surface rounded-xl p-4 border border-border flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="info" size={20} color={colors.primary} />
                <Text className="font-semibold text-foreground">App Version</Text>
              </View>
              <Text className="text-sm text-muted">1.0.0</Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-surface rounded-xl p-4 border border-border flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="privacy-tip" size={20} color={colors.primary} />
                <Text className="font-semibold text-foreground">Privacy Policy</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity className="bg-surface rounded-xl p-4 border border-border flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="description" size={20} color={colors.primary} />
                <Text className="font-semibold text-foreground">Terms of Service</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity className="bg-surface rounded-xl p-4 border border-border flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="bug-report" size={20} color={colors.primary} />
                <Text className="font-semibold text-foreground">Report a Bug</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity className="bg-error/10 rounded-xl py-4 flex-row items-center justify-center gap-2 mt-4 mb-4">
          <MaterialIcons name="logout" size={20} color={colors.error} />
          <Text className="font-semibold text-error">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
