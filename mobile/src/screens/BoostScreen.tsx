import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet, Text } from "react-native";
import { CaBack } from "../components/CaBack";
import { CaButton } from "../components/CaButton";
import { CaIconCircle } from "../components/CaIconCircle";
import { CaPlanCard } from "../components/CaPlanCard";
import { CaScreen } from "../components/CaScreen";
import { useAppState } from "../context/AppStateContext";
import { RootStackParamList } from "../navigation/types";
import { colors, fonts } from "../theme";

export function BoostScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { activateBoost } = useAppState();

  function activate() {
    activateBoost();
    navigation.navigate("MainTabs", { screen: "Results" });
  }

  return (
    <CaScreen>
      <CaBack onPress={() => navigation.goBack()} />
      <CaIconCircle icon="⚡" />
      <Text style={styles.title}>Boost</Text>
      <Text style={styles.sub}>הפרופיל שלך יוצג ראשון בתוצאות של אחרים למשך 30 דקות</Text>
      <CaPlanCard name="Boost בודד" sub="30 דקות בחשיפה מוגברת" price="₪15" selected />
      <CaButton title="הפעלת Boost — ₪15" onPress={activate} />
    </CaScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bodySemiBold, fontSize: 19, fontWeight: "600", textAlign: "center", marginBottom: 8, color: colors.textPrimary },
  sub: { fontSize: 13, color: colors.textSecondary, textAlign: "center", marginBottom: 26 },
});
