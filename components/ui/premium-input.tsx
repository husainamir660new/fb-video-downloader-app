/**
 * Premium Input Component
 * Modern text input with icon support and states
 */

import React, { useState } from 'react';
import { TextInput, View, Pressable, Text } from 'react-native';
import { cn } from '@/lib/utils';
import { useColors } from '@/hooks/use-colors';
import * as Haptics from 'expo-haptics';

interface PremiumInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  className?: string;
}

export function PremiumInput({
  placeholder,
  value,
  onChangeText,
  icon,
  rightIcon,
  onRightIconPress,
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  className,
}: PremiumInputProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);

  const handleRightIconPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRightIconPress?.();
  };

  return (
    <View className="w-full">
      <View
        className={cn(
          'flex-row items-center px-4 py-3 rounded-2xl border',
          'transition-colors duration-200',
          focused ? 'bg-surfaceActive border-primary' : 'bg-surface border-border',
          error && 'border-error bg-errorLight',
          disabled && 'opacity-50',
          className
        )}
      >
        {icon && <View className="mr-3">{icon}</View>}

        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          placeholderTextColor={colors.foregroundTertiary}
          className={cn(
            'flex-1 text-base font-medium',
            'text-foreground',
            multiline ? 'py-2' : ''
          )}
          style={{
            color: colors.foreground,
            paddingVertical: multiline ? 8 : 0,
          }}
        />

        {rightIcon && (
          <Pressable
            onPress={handleRightIconPress}
            disabled={disabled}
            className="ml-2 p-2"
          >
            {rightIcon}
          </Pressable>
        )}
      </View>

      {error && (
        <Text className="text-error text-sm font-medium mt-2">{error}</Text>
      )}
    </View>
  );
}
