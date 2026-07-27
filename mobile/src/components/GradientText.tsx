import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Platform, StyleProp, Text, TextStyle } from "react-native";
import { colors } from "../theme";

export function GradientText({
  children,
  style,
  colors: gradientColors = [colors.gold, colors.peach],
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  colors?: string[];
}) {
  if (Platform.OS === "web") {
    // @react-native-masked-view's web shim doesn't actually mask — fall back to real CSS text-clip.
    const gradientCss = `linear-gradient(90deg, ${gradientColors.join(", ")})`;
    return (
      <Text
        style={[
          style,
          {
            // @ts-expect-error react-native-web passes unknown style keys straight through to CSS
            backgroundImage: gradientCss,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
          },
        ]}
      >
        {children}
      </Text>
    );
  }

  return (
    <MaskedView maskElement={<Text style={[style, { backgroundColor: "transparent" }]}>{children}</Text>}>
      <LinearGradient colors={gradientColors as [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}
