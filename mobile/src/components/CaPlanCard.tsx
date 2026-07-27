import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii } from "../theme";

export function CaPlanCard({
  name,
  sub,
  price,
  priceSuffix,
  badge,
  badgeColors,
  selected,
  onPress,
}: {
  name: string;
  sub?: string;
  price?: string;
  priceSuffix?: string;
  badge?: string;
  badgeColors?: [string, string];
  selected?: boolean;
  onPress?: () => void;
}) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper style={[styles.card, selected && styles.cardSelected]} onPress={onPress}>
      {badge ? (
        <LinearGradient
          colors={badgeColors ?? [colors.accent1, colors.accent2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.badge}
        >
          <Text style={styles.badgeText}>{badge}</Text>
        </LinearGradient>
      ) : null}
      <View>
        <Text style={styles.name}>{name}</Text>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
      {price ? (
        <Text style={styles.price}>
          {price}
          {priceSuffix ? <Text style={styles.priceSuffix}>{priceSuffix}</Text> : null}
        </Text>
      ) : null}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.glassDarkBorder,
    backgroundColor: colors.glassDark,
    marginBottom: 10,
    position: "relative",
  },
  cardSelected: { borderColor: colors.accent2, backgroundColor: "rgba(255,111,145,0.08)" },
  badge: {
    position: "absolute",
    top: -9,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  badgeText: { fontSize: 10.5, fontWeight: "700", color: colors.btnPrimaryText },
  name: { fontSize: 14.5, fontWeight: "600", color: colors.textPrimary },
  sub: { fontSize: 11.5, color: colors.textSecondary, marginTop: 2 },
  price: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  priceSuffix: { fontSize: 11, fontWeight: "400", color: colors.textSecondary },
});
