/**
 * Premium Progress Indicator Component
 * Modern progress bar with animations and metrics
 */

import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { cn } from '@/lib/utils';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface PremiumProgressProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'success' | 'warning' | 'error';
  animated?: boolean;
}

export function PremiumProgress({
  progress,
  label,
  showPercentage = true,
  size = 'medium',
  variant = 'primary',
  animated = true,
}: PremiumProgressProps) {
  const progressValue = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      progressValue.value = withTiming(Math.min(progress, 100), {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      progressValue.value = Math.min(progress, 100);
    }
  }, [progress, animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value}%`,
  }));

  const sizeStyles = {
    small: 'h-1.5',
    medium: 'h-2.5',
    large: 'h-3.5',
  };

  const variantColors = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
  };

  const variantBgColors = {
    primary: 'bg-primaryLight',
    success: 'bg-successLight',
    warning: 'bg-warningLight',
    error: 'bg-errorLight',
  };

  return (
    <View className="w-full gap-2">
      {(label || showPercentage) && (
        <View className="flex-row justify-between items-center">
          {label && <Text className="text-sm font-semibold text-foreground">{label}</Text>}
          {showPercentage && (
            <Text className="text-sm font-bold text-primary">
              {Math.round(progress)}%
            </Text>
          )}
        </View>
      )}

      <View className={cn('w-full overflow-hidden rounded-full', variantBgColors[variant])}>
        <Animated.View
          className={cn(sizeStyles[size], variantColors[variant], 'rounded-full')}
          style={animatedStyle}
        />
      </View>
    </View>
  );
}
