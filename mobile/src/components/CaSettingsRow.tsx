import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

export function CaSettingsRow({
  label,
  onPress,
  danger,
  rightSlot,
}: {
  label: string;
  onPress?: () => void;
  danger?: boolean;
  rightSlot?: React.ReactNode;
}) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper style={styles.row} onPress={onPress}>
      <Text style={[styles.label, danger && styles.danger]}>{label}</Text>
      {rightSlot ?? (onPress ? <Text style={styles.arrow}>‹</Text> : null)}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassDarkBorder,
  },
  label: { fontSize: 14, color: colors.textPrimary },
  danger: { color: colors.danger },
  arrow: { color: colors.textMuted, fontSize: 16 },
});
