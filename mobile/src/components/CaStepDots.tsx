import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../theme";

export function CaStepDots({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 26 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.glassDarkBorder },
  dotActive: { backgroundColor: colors.accent2, width: 22, borderRadius: 5 },
});
