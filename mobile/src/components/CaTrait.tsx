import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii } from "../theme";

export function CaTrait({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  if (selected) {
    return (
      <Pressable onPress={onPress}>
        <LinearGradient
          colors={[colors.accent1, colors.accent2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.chip}
        >
          <Text style={styles.textSelected}>{label}</Text>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={[styles.chip, styles.chipUnselected]}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
  },
  chipUnselected: {
    borderWidth: 1,
    borderColor: colors.glassDarkBorder,
    backgroundColor: colors.glassDark,
  },
  text: { fontSize: 13, color: colors.textSecondary },
  textSelected: { fontSize: 13, color: colors.btnPrimaryText, fontWeight: "600" },
});
