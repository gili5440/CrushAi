import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { Alert, StyleSheet, Text } from "react-native";
import { CaBack } from "../components/CaBack";
import { CaButton } from "../components/CaButton";
import { CaIconCircle } from "../components/CaIconCircle";
import { CaInfoCard } from "../components/CaInfoCard";
import { CaScreen } from "../components/CaScreen";
import { RootStackParamList } from "../navigation/types";
import { colors, fonts } from "../theme";

export function InviteScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <CaScreen>
      <CaBack onPress={() => navigation.goBack()} />
      <CaIconCircle icon="🎁" />
      <Text style={styles.title}>הזמנת חברים</Text>
      <Text style={styles.sub}>כל חבר/ה שמצטרפ/ת עם הקוד שלך מקבל/ת שבוע Premium חינם — וגם את/ה.</Text>
      <CaInfoCard>
        <Text style={styles.code}>CRUSH-DK92</Text>
      </CaInfoCard>
      <CaButton title="העתקת קוד" onPress={() => Alert.alert("הקוד הועתק!")} />
      <CaButton title="שיתוף עם חברים" variant="secondary" onPress={() => Alert.alert("נפתח חלון שיתוף")} />
    </CaScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bodySemiBold, fontSize: 19, fontWeight: "600", textAlign: "center", marginBottom: 8, color: colors.textPrimary },
  sub: { fontSize: 13, color: colors.textSecondary, textAlign: "center", marginBottom: 20 },
  code: { textAlign: "center", fontSize: 18, fontWeight: "700", letterSpacing: 2, color: colors.textPrimary },
});
