import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

export function CaIconCircle({ icon }: { icon: string }) {
  return (
    <View style={styles.circle}>
      <Text style={styles.icon}>{icon}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 22,
    backgroundColor: colors.glassDark,
    borderWidth: 1,
    borderColor: colors.glassDarkBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 34 },
});
