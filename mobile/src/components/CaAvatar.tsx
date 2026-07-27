import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { colors } from "../theme";

export function CaAvatar({
  seed,
  size = 48,
  uri,
  borderColor,
}: {
  seed?: string;
  size?: number;
  uri?: string;
  borderColor?: string;
}) {
  const source =
    uri ??
    `https://api.dicebear.com/9.x/lorelei/png?seed=${encodeURIComponent(seed ?? "guest")}&backgroundColor=2b1b42,4a3560,3a2e4a`;

  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2, borderColor: borderColor ?? colors.glassDarkBorder },
      ]}
    >
      <Image source={{ uri: source }} style={{ width: size, height: size }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    borderWidth: 1.5,
    backgroundColor: colors.glassDark,
  },
});
