/**
 * Premium Dark Theme Configuration
 * Modern, professional color system for Google Play Store quality app
 */

/** @type {const} */
const themeColors = {
  // Primary brand colors - Modern blue gradient
  primary: { light: '#0066FF', dark: '#0066FF' },
  primaryLight: { light: '#E6F0FF', dark: '#1A2B4D' },
  primaryDark: { light: '#0052CC', dark: '#0080FF' },

  // Background colors - Deep dark theme
  background: { light: '#FFFFFF', dark: '#0F1419' },
  backgroundSecondary: { light: '#F8F9FA', dark: '#1A1F26' },
  backgroundTertiary: { light: '#F0F2F5', dark: '#252C35' },

  // Surface colors - Elevated surfaces with depth
  surface: { light: '#FFFFFF', dark: '#1A1F26' },
  surfaceHover: { light: '#F8F9FA', dark: '#252C35' },
  surfaceActive: { light: '#F0F2F5', dark: '#2F3A47' },

  // Text colors - High contrast for readability
  foreground: { light: '#0F1419', dark: '#FFFFFF' },
  foregroundSecondary: { light: '#65676B', dark: '#B0B3B9' },
  foregroundTertiary: { light: '#8A8D91', dark: '#8A8D91' },

  // Accent colors
  accent: { light: '#FF6B35', dark: '#FF7A4D' },
  accentLight: { light: '#FFE6D5', dark: '#4D2817' },

  // Status colors
  success: { light: '#31A24C', dark: '#4ADE80' },
  successLight: { light: '#E6F7ED', dark: '#1B3A24' },
  warning: { light: '#F59E0B', dark: '#FBBF24' },
  warningLight: { light: '#FEF3C7', dark: '#3F2C0A' },
  error: { light: '#DC2626', dark: '#EF4444' },
  errorLight: { light: '#FEE2E2', dark: '#3F1010' },
  info: { light: '#0066FF', dark: '#60A5FA' },
  infoLight: { light: '#E6F0FF', dark: '#1B2B4D' },

  // Border colors
  border: { light: '#E5E7EB', dark: '#2F3A47' },
  borderLight: { light: '#F3F4F6', dark: '#1F2937' },
  borderDark: { light: '#D1D5DB', dark: '#3F4A57' },

  // Muted colors
  muted: { light: '#9CA3AF', dark: '#6B7280' },
  mutedLight: { light: '#D1D5DB', dark: '#4B5563' },

  // Gradient colors
  gradientStart: { light: '#0066FF', dark: '#0066FF' },
  gradientEnd: { light: '#00D4FF', dark: '#00D4FF' },
  gradientAccentStart: { light: '#FF6B35', dark: '#FF7A4D' },
  gradientAccentEnd: { light: '#FF8C42', dark: '#FF9D5C' },

  // Overlay colors
  overlay: { light: 'rgba(15, 20, 25, 0.5)', dark: 'rgba(0, 0, 0, 0.7)' },
  overlayLight: { light: 'rgba(15, 20, 25, 0.2)', dark: 'rgba(0, 0, 0, 0.4)' },
};

module.exports = { themeColors };
