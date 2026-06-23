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
import { getUserPreferences, updateUserPreferences, getReferralData } from "@/lib/storage";
import { UserPreferences, ReferralData } from "@/lib/types";

export default function SettingsScreen() {
  const colors = useColors();

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);

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
              <View className="flex-row items-center justify-between py-2">
                <Text className="text-sm text-muted">Build</Text>
                <Text className="font-semibold text-foreground">1</Text>
              </View>
            </View>
          </View>

          {/* Help Section */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground uppercase">Help</Text>
            <TouchableOpacity className="bg-surface rounded-lg p-4 border border-border flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="help" size={24} color={colors.primary} />
                <Text className="font-semibold text-foreground">FAQ</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity className="bg-surface rounded-lg p-4 border border-border flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="mail" size={24} color={colors.primary} />
                <Text className="font-semibold text-foreground">Contact Support</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
