import React from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";
import { colors, fonts, radii } from "../theme";

export function CaTextarea({ style, ...props }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      multiline
      textAlignVertical="top"
      style={[styles.textarea, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  textarea: {
    fontFamily: fonts.body,
    width: "100%",
    minHeight: 90,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.glassDarkBorder,
    backgroundColor: colors.glassDark,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 16,
  },
});
