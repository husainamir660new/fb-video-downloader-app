/**
 * Tabs Group Index
 * This file serves as the default route for the (tabs) group
 * It redirects to the home tab on app startup
 * 
 * CRITICAL FIX: Route must be fully qualified with (tabs) group prefix
 * to prevent route resolution crash on native Android
 */

import { Redirect } from "expo-router";

export default function TabsIndex() {
  // Redirect to home tab within tabs group
  // FIXED: Changed from "/home" to "/(tabs)/home" to match Tabs.Screen name="home"
  return <Redirect href="/(tabs)/home" />;
}
