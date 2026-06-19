// NativeWind + Pressable: Enable className support for Pressable
// The premium UI uses className extensively on Pressable for layout and styling
// Interaction feedback is handled via inline style prop with pressed state
import { Pressable } from "react-native";
import { remapProps } from "nativewind";

// Enable className mapping for Pressable to support modern UI
remapProps(Pressable, { className: true });
