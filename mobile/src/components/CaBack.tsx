import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../theme";

export function CaBack({ label = "← חזרה", onPress }: { label?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 13, color: colors.textSecondary, marginBottom: 16 },
});
