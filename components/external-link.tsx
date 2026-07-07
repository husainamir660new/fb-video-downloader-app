import { Href, Link } from "expo-router";
import { Linking } from "react-native";
import { type ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: Href & string };

export function ExternalLink({ href, ...rest }: Props) {
  const handlePress = async (event: any) => {
    event.preventDefault();
    try {
      await Linking.openURL(href);
    } catch (error) {
      console.error("Failed to open URL:", error);
    }
  };

  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={handlePress}
    />
  );
}
