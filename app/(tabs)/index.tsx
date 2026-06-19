/**
 * Tabs Group Index
 * This file serves as the default route for the (tabs) group
 * It redirects to the home tab on app startup
 */

import { Redirect } from "expo-router";

export default function TabsIndex() {
  // Redirect to home tab
  return <Redirect href="/home" />;
}
