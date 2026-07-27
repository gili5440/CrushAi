import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { CaBack } from "../components/CaBack";
import { CaButton } from "../components/CaButton";
import { CaIconCircle } from "../components/CaIconCircle";
import { CaInput } from "../components/CaInput";
import { CaScreen } from "../components/CaScreen";
import { RootStackParamList } from "../navigation/types";
import { colors, fonts } from "../theme";

// Note: no SMS provider is wired up yet — any 6-digit code is accepted so the
// rest of the signup flow (onboarding, resume-after-auth) can be built and tested.
export function OtpScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [code, setCode] = useState("");

  function verify() {
    if (code.length !== 6) {
      Alert.alert("קוד לא תקין", "יש להזין קוד בן 6 ספרות.");
      return;
    }
    navigation.navigate("Onboarding");
  }

  return (
    <CaScreen>
      <CaBack onPress={() => navigation.goBack()} />
      <CaIconCircle icon="📱" />
      <Text style={styles.title}>אימות מספר טלפון</Text>
      <Text style={styles.sub}>שלחנו קוד בן 6 ספרות ב-SMS למספר שהזנת</Text>
      <CaInput
        value={code}
        onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="0 0 0 0 0 0"
        style={styles.codeInput}
      />
      <CaButton title="אימות" onPress={verify} />
      <Pressable onPress={() => Alert.alert("נשלח קוד חדש")}>
        <Text style={styles.resend}>לא קיבלת קוד? שליחה חזרה</Text>
      </Pressable>
    </CaScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bodySemiBold, fontSize: 19, fontWeight: "600", textAlign: "center", marginBottom: 8, color: colors.textPrimary },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: "center", marginBottom: 28 },
  codeInput: { textAlign: "center", fontSize: 22, letterSpacing: 10 },
  resend: { textAlign: "center", fontSize: 12, color: colors.purple400, marginTop: 4 },
});
