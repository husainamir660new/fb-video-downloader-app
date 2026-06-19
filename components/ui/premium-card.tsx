/**
 * Premium Card Component
 * Modern card with shadow, border, and hover effects
 */

import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

interface PremiumCardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'small' | 'medium' | 'large';
  className?: string;
}

export function PremiumCard({
  children,
  variant = 'default',
  padding = 'medium',
  className,
  ...props
}: PremiumCardProps) {
  const variantStyles = {
    default: 'bg-surface border border-border',
    elevated: 'bg-surface shadow-lg',
    outlined: 'bg-transparent border-2 border-border',
    filled: 'bg-surfaceHover border border-borderLight',
  };

  const paddingStyles = {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6',
  };

  return (
    <View
      className={cn(
        'rounded-3xl',
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}
