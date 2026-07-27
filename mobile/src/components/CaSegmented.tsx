import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../theme";

export function CaSegmented({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable key={opt.value} style={[styles.btn, active && styles.btnActive]} onPress={() => onChange(opt.value)}>
            <Text style={[styles.text, active && styles.textActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: colors.glassDark,
    borderWidth: 1,
    borderColor: colors.glassDarkBorder,
    borderRadius: radii.pill,
    padding: 4,
    marginBottom: 16,
  },
  btn: { flex: 1, paddingVertical: 10, borderRadius: radii.pill, alignItems: "center" },
  btnActive: { backgroundColor: colors.accent1 },
  text: { fontSize: 13.5, fontWeight: "600", color: colors.textSecondary },
  textActive: { color: colors.btnPrimaryText },
});
