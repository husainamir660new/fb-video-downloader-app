import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { usePremium } from "@/lib/premium-context";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";

/**
 * Premium Screen
 * Displays premium features and subscription management
 */
export default function PremiumScreen() {
  const colors = useColors();
  const { status, isPremium, upgradeToPremium, restorePurchases } = usePremium();
  const [isLoading, setIsLoading] = useState(false);

  const premiumFeatures = [
    {
      id: "1",
      title: "720p Downloads",
      description: "Download videos in the highest quality available",
      icon: "hd",
      free: false,
    },
    {
      id: "2",
      title: "Unlimited Downloads",
      description: "No limits on how many videos you can download",
      icon: "infinity",
      free: false,
    },
    {
      id: "3",
      title: "Ad-Free Experience",
      description: "Enjoy the app without any advertisements",
      icon: "block",
      free: false,
    },
    {
      id: "4",
      title: "Batch Downloads",
      description: "Download multiple videos at once",
      icon: "folder-multiple",
      free: false,
    },
    {
      id: "5",
      title: "Video Conversion",
      description: "Convert videos to MP3 or other formats",
      icon: "music-box-multiple",
      free: false,
    },
    {
      id: "6",
      title: "Cloud Storage",
      description: "Store your downloads in the cloud",
      icon: "cloud-upload",
      free: false,
    },
  ];

  const handleUpgrade = async () => {
    try {
      setIsLoading(true);
      await upgradeToPremium();
    } catch (error) {
      console.error("Failed to upgrade:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsLoading(true);
      await restorePurchases();
    } catch (error) {
      console.error("Failed to restore purchases:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatExpiryDate = (timestamp: number | null) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderFeatureItem = ({ item }: { item: any }) => (
    <View className="flex-row items-start gap-3 mb-4 p-4 bg-surface rounded-lg border border-border">
      <View
        className="w-12 h-12 rounded-lg items-center justify-center"
        style={{
          backgroundColor: item.free ? colors.primary : colors.primary + "20",
        }}
      >
        <MaterialIcons
          name={item.icon as any}
          size={24}
          color={item.free ? "white" : colors.primary}
        />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-foreground">{item.title}</Text>
        <Text className="text-sm text-muted mt-1">{item.description}</Text>
      </View>
      {!item.free && !isPremium && (
        <MaterialIcons name="lock" size={20} color={colors.muted} />
      )}
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Premium</Text>
            <Text className="text-base text-muted">Unlock all features</Text>
          </View>

          {/* Status Card */}
          <View
            className="rounded-lg p-6 gap-4"
            style={{
              backgroundColor: isPremium ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: isPremium ? colors.primary : colors.border,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="gap-1">
                <Text
                  className="text-sm font-semibold"
                  style={{
                    color: isPremium ? "white" : colors.muted,
                  }}
                >
                  Current Status
                </Text>
                <Text
                  className="text-2xl font-bold"
                  style={{
                    color: isPremium ? "white" : colors.foreground,
                  }}
                >
                  {isPremium ? "Premium" : "Free"}
                </Text>
              </View>
              <MaterialIcons
                name={isPremium ? "verified" : "star-outline"}
                size={40}
                color={isPremium ? "white" : colors.primary}
              />
            </View>

            {isPremium && status.expiresAt && (
              <View className="pt-4 border-t" style={{ borderTopColor: "rgba(255,255,255,0.2)" }}>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
                  Expires on: {formatExpiryDate(status.expiresAt)}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            {!isPremium ? (
              <>
                <TouchableOpacity
                  onPress={handleUpgrade}
                  disabled={isLoading}
                  className="bg-primary rounded-lg py-4 items-center justify-center flex-row gap-2"
                  style={{
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  <MaterialIcons name="star" size={20} color="white" />
                  <Text className="text-white font-bold text-lg">
                    {isLoading ? "Processing..." : "Upgrade to Premium"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleRestore}
                  disabled={isLoading}
                  className="bg-surface border border-border rounded-lg py-3 items-center justify-center"
                >
                  <Text className="text-foreground font-semibold">Restore Purchases</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={handleRestore}
                className="bg-surface border border-border rounded-lg py-3 items-center justify-center"
              >
                <Text className="text-foreground font-semibold">Manage Subscription</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Features List */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Premium Features</Text>
            <FlatList
              data={premiumFeatures}
              renderItem={renderFeatureItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>

          {/* FAQ Section */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-3">
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="help" size={20} color={colors.primary} />
              <Text className="font-semibold text-foreground">FAQ</Text>
            </View>
            <View className="gap-3">
              <View>
                <Text className="font-semibold text-foreground text-sm">Can I cancel anytime?</Text>
                <Text className="text-xs text-muted mt-1">
                  Yes, you can cancel your subscription at any time from your app store account.
                </Text>
              </View>
              <View>
                <Text className="font-semibold text-foreground text-sm">Is there a free trial?</Text>
                <Text className="text-xs text-muted mt-1">
                  Yes, enjoy 7 days free before your subscription starts.
                </Text>
              </View>
              <View>
                <Text className="font-semibold text-foreground text-sm">What payment methods are accepted?</Text>
                <Text className="text-xs text-muted mt-1">
                  We accept all major credit cards and payment methods supported by your app store.
                </Text>
              </View>
            </View>
          </View>

          {/* Pricing Info */}
          <View className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <Text className="text-sm text-primary font-semibold">
              💳 Premium: $4.99/month or $49.99/year
            </Text>
            <Text className="text-xs text-primary/80 mt-2">
              Save 17% with annual subscription
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
