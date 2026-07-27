import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet, Text } from "react-native";
import { CaButton } from "../components/CaButton";
import { CaIconCircle } from "../components/CaIconCircle";
import { CaInfoCard } from "../components/CaInfoCard";
import { CaScreen } from "../components/CaScreen";
import { useAppState } from "../context/AppStateContext";
import { RootStackParamList } from "../navigation/types";
import { colors, fonts } from "../theme";

export function VerifyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { setVerifiedProfile } = useAppState();

  function complete() {
    setVerifiedProfile(true);
    navigation.goBack();
  }

  return (
    <CaScreen>
      <CaIconCircle icon="🪪" />
      <Text style={styles.title}>אימות פרופיל</Text>
      <Text style={styles.sub}>צלמי סלפי קצר לפי ההנחיות — ה-AI משווה אותו לתמונות הפרופיל שלך כדי לאשר שזו את/ה באמת.</Text>
      <CaInfoCard title="למה זה חשוב?">פרופילים מאומתים מקבלים חשיפה גבוהה יותר בתוצאות החיפוש, ומגבירים אמון בקרב משתמשים אחרים.</CaInfoCard>
      <CaButton title="התחלת אימות" onPress={complete} />
      <CaButton title="בטל" variant="secondary" onPress={() => navigation.goBack()} />
    </CaScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bodySemiBold, fontSize: 19, fontWeight: "600", textAlign: "center", marginBottom: 8, color: colors.textPrimary },
  sub: { fontSize: 13, color: colors.textSecondary, textAlign: "center", marginBottom: 20, lineHeight: 19 },
});
