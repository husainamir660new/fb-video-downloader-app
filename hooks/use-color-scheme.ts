import { useThemeContext } from "@/lib/theme-provider";
import { useColorScheme as useSystemColorScheme } from "react-native";

export function useColorScheme() {
  try {
    // Try to get from ThemeProvider context
    return useThemeContext().colorScheme;
  } catch (error) {
    // Fallback to system color scheme if ThemeProvider is not available
    // This can happen in some edge cases or during initialization
    return useSystemColorScheme() ?? "light";
  }
}
