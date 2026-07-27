import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts, radii } from "../theme";

type Props = {
  title: string;
  micro?: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  loading?: boolean;
};

export function CaButton({ title, micro, onPress, variant = "primary", disabled, loading }: Props) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";

  const content = loading ? (
    <ActivityIndicator color={isPrimary ? colors.btnPrimaryText : colors.textPrimary} />
  ) : (
    <>
      <Text style={[styles.text, isPrimary && styles.textPrimary, isDanger && styles.textDanger]}>{title}</Text>
      {micro ? <Text style={styles.micro}>{micro}</Text> : null}
    </>
  );

  if (isPrimary) {
    return (
      <Pressable onPress={onPress} disabled={disabled || loading}>
        {({ pressed }) => (
          <LinearGradient
            colors={[colors.btnPrimaryFrom, colors.btnPrimaryTo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.base, styles.primaryBorder, (disabled || loading) && styles.disabled, pressed && styles.pressed]}
          >
            {content}
          </LinearGradient>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variant === "secondary" && styles.secondary,
        isDanger && styles.danger,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
    minHeight: 58,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginBottom: 12,
  },
  primaryBorder: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    shadowColor: colors.purple500,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 4,
  },
  secondary: {
    backgroundColor: colors.glassDark,
    borderWidth: 1,
    borderColor: colors.glassDarkBorder,
  },
  danger: {
    backgroundColor: "rgba(255,80,80,0.12)",
    borderWidth: 1,
    borderColor: colors.danger,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  text: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15.5,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
  textPrimary: { color: colors.btnPrimaryText },
  textDanger: { color: colors.danger },
  micro: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: "rgba(59,22,14,0.78)",
    marginTop: 3,
    textAlign: "center",
  },
});
