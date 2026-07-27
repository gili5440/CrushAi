import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

export function CaBell({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.bell} onPress={onPress} hitSlop={8}>
      <Text style={styles.icon}>🔔</Text>
      <View style={styles.dot} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bell: {
    position: "absolute",
    top: 4,
    left: 4,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.glassDark,
    borderWidth: 1,
    borderColor: colors.glassDarkBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 16 },
  dot: {
    position: "absolute",
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent2,
  },
});
