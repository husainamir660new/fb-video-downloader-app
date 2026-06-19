/**
 * Skeleton Loader Component
 * Modern loading placeholder with pulse animation
 */

import React, { useEffect } from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/utils';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface SkeletonLoaderProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export function SkeletonLoader({
  width = '100%',
  height = 'h-4',
  borderRadius = 'rounded-lg',
  className,
}: SkeletonLoaderProps) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      className={cn(
        'bg-surfaceHover',
        height,
        borderRadius,
        className
      )}
      style={[
        {
          width: typeof width === 'number' ? width : '100%',
        },
        animatedStyle,
      ]}
    />
  );
}

interface SkeletonCardProps {
  lines?: number;
  className?: string;
}

export function SkeletonCard({ lines = 3, className }: SkeletonCardProps) {
  return (
    <View className={cn('gap-3 p-4 bg-surface rounded-3xl', className)}>
      <SkeletonLoader height="h-12" borderRadius="rounded-2xl" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLoader
          key={i}
          height="h-3"
          borderRadius="rounded-lg"
          width={i === lines - 1 ? '70%' : '100%'}
        />
      ))}
    </View>
  );
}
