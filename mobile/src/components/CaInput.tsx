import React from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";
import { colors, fonts, radii } from "../theme";

export function CaInput({ style, ...props }: TextInputProps) {
  return <TextInput placeholderTextColor={colors.textMuted} style={[styles.input, style]} {...props} />;
}

const styles = StyleSheet.create({
  input: {
    fontFamily: fonts.body,
    width: "100%",
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.glassDarkBorder,
    backgroundColor: colors.glassDark,
    color: colors.textPrimary,
    fontSize: 14.5,
  },
});
