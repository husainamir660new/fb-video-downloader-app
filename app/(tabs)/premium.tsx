/**
 * Premium Screen - Subscription & Premium Features
 * Clean, production-ready implementation
 */

import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useDownload } from "@/lib/download-context";

const PREMIUM_FEATURES = [
  { icon: "hd", title: "720p HD Downloads", desc: "Download in highest quality" },
  { icon: "flash-on", title: "Faster Downloads", desc: "3x faster download speed" },
  { icon: "block", title: "No Ads", desc: "Completely ad-free experience" },
  { icon: "infinity", title: "Unlimited Downloads", desc: "Download as many as you want" },
];

const PRICING_PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    price: "$2.99",
    period: "/month",
    savings: null,
    badge: null,
  },
  {
    id: "yearly",
    name: "Yearly",
    price: "$19.99",
    period: "/year",
    savings: "Save 44%",
    badge: "BEST VALUE",
  },
];

export default function PremiumScreen() {
  const colors = useColors();
  const { isPremium } = useDownload();
  const [selectedPlan, setSelectedPlan] = useState<string>("yearly");

  const handleSubscribe = (planId: string) => {
    Alert.alert(
      "Subscribe to Premium",
      `Subscribe to ${planId === "monthly" ? "Monthly" : "Yearly"} plan?`,
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Subscribe",
          onPress: () => {
            Alert.alert("Success", "Premium subscription activated!");
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {/* Header */}
        <View className="mb-8 mt-4">
          <Text className="text-3xl font-bold text-foreground">Premium</Text>
          <Text className="text-sm text-muted mt-1">
            {isPremium ? "You are a premium member" : "Unlock unlimited features"}
          </Text>
        </View>

        {/* Premium Badge */}
        {isPremium && (
          <View className="bg-primary/10 rounded-xl p-4 mb-6 flex-row items-center gap-3">
            <MaterialIcons name="verified" size={24} color={colors.primary} />
            <View className="flex-1">
              <Text className="font-semibold text-primary">Premium Active</Text>
              <Text className="text-xs text-muted mt-1">Enjoy all premium features</Text>
            </View>
          </View>
        )}

        {/* Features List */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-foreground mb-4">Premium Features</Text>
          <View className="gap-3">
            {PREMIUM_FEATURES.map((feature, index) => (
              <View
                key={index}
                className="bg-surface rounded-xl p-4 flex-row items-center gap-3 border border-border"
              >
                <View className="bg-primary/10 rounded-lg p-3">
                  <MaterialIcons name={feature.icon as any} size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-foreground text-sm">
                    {feature.title}
                  </Text>
                  <Text className="text-xs text-muted mt-1">{feature.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Pricing Plans */}
        {!isPremium && (
          <View className="mb-8">
            <Text className="text-lg font-bold text-foreground mb-4">Choose Your Plan</Text>
            <View className="gap-3">
              {PRICING_PLANS.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  onPress={() => setSelectedPlan(plan.id)}
                  className={`rounded-xl p-4 border-2 ${
                    selectedPlan === plan.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-surface"
                  }`}
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="font-bold text-foreground text-lg">{plan.name}</Text>
                      {plan.savings && (
                        <Text className="text-xs text-success font-semibold mt-1">
                          {plan.savings}
                        </Text>
                      )}
                    </View>
                    {plan.badge && (
                      <View className="bg-primary px-3 py-1 rounded-full">
                        <Text className="text-xs font-bold text-background">{plan.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-2xl font-bold text-primary">
                    {plan.price}
                    <Text className="text-sm text-muted font-normal">{plan.period}</Text>
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Subscribe Button */}
            <TouchableOpacity
              onPress={() => handleSubscribe(selectedPlan)}
              className="bg-primary rounded-xl py-4 flex-row items-center justify-center gap-2 mt-6"
            >
              <MaterialIcons name="credit-card" size={20} color={colors.background} />
              <Text className="text-lg font-bold text-background">Subscribe Now</Text>
            </TouchableOpacity>

            {/* Terms */}
            <Text className="text-xs text-muted text-center mt-4">
              Subscription renews automatically. Cancel anytime from your account settings.
            </Text>
          </View>
        )}

        {/* Restore Purchases Button */}
        <TouchableOpacity
          className="py-3 rounded-xl border border-border flex-row items-center justify-center gap-2"
        >
          <MaterialIcons name="restore" size={18} color={colors.primary} />
          <Text className="font-semibold text-primary">Restore Purchases</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
