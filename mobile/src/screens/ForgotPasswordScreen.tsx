import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import { CaBack } from "../components/CaBack";
import { CaButton } from "../components/CaButton";
import { CaIconCircle } from "../components/CaIconCircle";
import { CaInput } from "../components/CaInput";
import { CaScreen } from "../components/CaScreen";
import { RootStackParamList } from "../navigation/types";
import { colors, fonts } from "../theme";

export function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState("");

  function send() {
    Alert.alert("קישור לאיפוס נשלח לאימייל שלך");
    navigation.goBack();
  }

  return (
    <CaScreen>
      <CaBack label="← חזרה להתחברות" onPress={() => navigation.goBack()} />
      <CaIconCircle icon="🔑" />
      <Text style={styles.title}>שחזור סיסמה</Text>
      <Text style={styles.sub}>נשלח לך קישור לאיפוס הסיסמה לכתובת האימייל שלך</Text>
      <Text style={styles.fieldLabel}>אימייל</Text>
      <CaInput placeholder="name@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <CaButton title="שליחת קישור" onPress={send} disabled={email.length < 4} />
    </CaScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bodySemiBold, fontSize: 19, fontWeight: "600", textAlign: "center", marginBottom: 8, color: colors.textPrimary },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: "center", marginBottom: 28 },
  fieldLabel: { fontSize: 12.5, color: colors.textSecondary, marginBottom: 6, marginHorizontal: 2 },
});
