/**
 * Premium Button Component
 * Modern, accessible button with multiple variants and states
 */

import React from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { cn } from '@/lib/utils';
import { useColors } from '@/hooks/use-colors';
import * as Haptics from 'expo-haptics';

interface PremiumButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export function PremiumButton({
  onPress,
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  className,
}: PremiumButtonProps) {
  const colors = useColors();

  const handlePress = async () => {
    if (!disabled && !loading) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const variantStyles = {
    primary: 'bg-primary',
    secondary: 'bg-surface border border-border',
    tertiary: 'bg-transparent',
    danger: 'bg-error',
    success: 'bg-success',
  };

  const textColorStyles = {
    primary: 'text-white',
    secondary: 'text-foreground',
    tertiary: 'text-primary',
    danger: 'text-white',
    success: 'text-white',
  };

  const sizeStyles = {
    small: 'px-4 py-2',
    medium: 'px-6 py-3',
    large: 'px-8 py-4',
  };

  const textSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          opacity: pressed && !disabled ? 0.8 : 1,
          transform: [{ scale: pressed && !disabled ? 0.96 : 1 }],
        },
      ]}
    >
      <View
        className={cn(
          'flex-row items-center justify-center rounded-2xl',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          disabled && 'opacity-50',
          className
        )}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'secondary' ? colors.foreground : 'white'}
          />
        ) : (
          <>
            {icon && <View className="mr-2">{icon}</View>}
            <Text
              className={cn(
                'font-semibold',
                textColorStyles[variant],
                textSizes[size]
              )}
            >
              {title}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}
