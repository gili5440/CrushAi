import React from "react";
import { StyleSheet, View } from "react-native";
import { CaScreen } from "../components/CaScreen";
import { GradientText } from "../components/GradientText";
import { fonts } from "../theme";

export function SplashScreen() {
  return (
    <CaScreen scroll={false}>
      <View style={styles.wrap}>
        <GradientText style={styles.wordmark}>CrushAI</GradientText>
      </View>
    </CaScreen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  wordmark: { fontFamily: fonts.displayItalicSemi, fontStyle: "italic", fontWeight: "700", fontSize: 44 },
});
