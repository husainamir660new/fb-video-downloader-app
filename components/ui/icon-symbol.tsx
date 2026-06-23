// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

/**
 * SF Symbols to Material Icons mapping
 * IMPORTANT: Only use icon names that exist in MaterialIcons
 * Verify at: https://icons.expo.fyi/
 */
const MAPPING: Record<string, string> = {
  // Home tab
  "house.fill": "home",
  // History tab
  "clock.fill": "history",
  // Premium tab
  "star.fill": "star-rate",
  // Settings tab
  "gear": "settings",
  // Other common icons
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "navigate-next",
  // Download icons
  "arrow.down": "download",
  "arrow.down.circle": "download",
  // Video icons
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  // UI icons
  "xmark": "close",
  "checkmark": "check",
  "plus": "add",
  "minus": "remove",
  // Navigation
  "chevron.left": "navigate-before",
  "chevron.up": "expand-less",
  "chevron.down": "expand-more",
  // Additional common icons
  "link": "link",
  "info": "info",
  "error": "error",
  "warning": "warning",
  "success": "check-circle",
  "search": "search",
  "menu": "menu",
  "more": "more-vert",
};

// Valid MaterialIcons names (subset of commonly used ones )
const VALID_ICON_NAMES = new Set([
  "home",
  "history",
  "star-rate",
  "settings",
  "send",
  "code",
  "navigate-next",
  "download",
  "play-arrow",
  "pause",
  "close",
  "check",
  "add",
  "remove",
  "navigate-before",
  "expand-less",
  "expand-more",
  "link",
  "info",
  "error",
  "warning",
  "check-circle",
  "search",
  "menu",
  "more-vert",
  "help",
]);

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 *
 * Usage:
 * ```tsx
 * <IconSymbol name="house.fill" size={28} color="#000" />
 * ```
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight,
}: {
  name: string;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  // Get the mapped icon name
  let iconName = MAPPING[name];

  // If not in mapping, try to use the name directly (for already-mapped names)
  if (!iconName) {
    iconName = name;
  }

  // Validate icon name exists in MaterialIcons
  if (!VALID_ICON_NAMES.has(iconName)) {
    // Fallback to help icon if invalid
    iconName = "help";
  }

  return (
    <MaterialIcons
      color={color}
      size={size}
      name={iconName as any}
      style={style}
    />
  );
}
