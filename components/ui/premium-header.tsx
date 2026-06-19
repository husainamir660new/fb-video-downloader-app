/**
 * Premium Header Component
 * Modern app header with title and actions
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { cn } from '@/lib/utils';
import * as Haptics from 'expo-haptics';

interface PremiumHeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: {
    icon: React.ReactNode;
    onPress: () => void;
  };
  rightAction?: {
    icon: React.ReactNode;
    onPress: () => void;
  };
  className?: string;
}

export function PremiumHeader({
  title,
  subtitle,
  leftAction,
  rightAction,
  className,
}: PremiumHeaderProps) {
  const handlePress = async (onPress: () => void) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <View className={cn('px-4 py-4 bg-background', className)}>
      <View className="flex-row items-center justify-between">
        {leftAction ? (
          <Pressable
            onPress={() => handlePress(leftAction.onPress)}
            className="p-2 -ml-2"
          >
            {leftAction.icon}
          </Pressable>
        ) : (
          <View className="w-10" />
        )}

        <View className="flex-1 mx-4">
          <Text className="text-xl font-bold text-foreground text-center">
            {title}
          </Text>
          {subtitle && (
            <Text className="text-sm text-foregroundSecondary text-center mt-1">
              {subtitle}
            </Text>
          )}
        </View>

        {rightAction ? (
          <Pressable
            onPress={() => handlePress(rightAction.onPress)}
            className="p-2 -mr-2"
          >
            {rightAction.icon}
          </Pressable>
        ) : (
          <View className="w-10" />
        )}
      </View>
    </View>
  );
}
