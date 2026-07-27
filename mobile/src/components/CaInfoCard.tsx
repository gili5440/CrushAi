import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../theme";

export function CaInfoCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glassDark,
    borderWidth: 1,
    borderColor: colors.glassDarkBorder,
    borderRadius: radii.md,
    padding: 16,
    marginBottom: 14,
  },
  title: { color: colors.textPrimary, fontWeight: "600", fontSize: 13, marginBottom: 4 },
  body: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
});
