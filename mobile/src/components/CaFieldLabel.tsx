import React from "react";
import { StyleSheet, Text } from "react-native";
import { colors } from "../theme";

export function CaFieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: { fontSize: 12.5, color: colors.textSecondary, marginBottom: 6, marginTop: 4, marginHorizontal: 2 },
});
