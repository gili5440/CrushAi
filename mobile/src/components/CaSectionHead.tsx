import React from "react";
import { StyleProp, StyleSheet, Text, TextStyle } from "react-native";
import { colors } from "../theme";

export function CaSectionHead({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.text, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  text: {
    textAlign: "right",
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    letterSpacing: 0.3,
    marginVertical: 14,
  },
});
