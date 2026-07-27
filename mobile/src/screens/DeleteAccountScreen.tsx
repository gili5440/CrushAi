import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import { CaButton } from "../components/CaButton";
import { CaIconCircle } from "../components/CaIconCircle";
import { CaScreen } from "../components/CaScreen";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../navigation/types";
import { colors, fonts } from "../theme";

export function DeleteAccountScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { deleteAccount } = useAuth();
  const [loading, setLoading] = useState(false);

  async function confirmDelete() {
    setLoading(true);
    try {
      await deleteAccount();
      navigation.navigate("MainTabs", { screen: "Home" });
    } catch {
      Alert.alert("שגיאה", "לא הצלחנו למחוק את החשבון. נסה/נסי שוב.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <CaScreen>
      <CaIconCircle icon="⚠️" />
      <Text style={styles.title}>מחיקת חשבון</Text>
      <Text style={styles.sub}>הפעולה תמחק לצמיתות את הפרופיל, ההתאמות וההודעות שלך. לא ניתן לשחזר.</Text>
      <CaButton title="מחיקה לצמיתות" variant="danger" onPress={confirmDelete} loading={loading} />
      <CaButton title="ביטול" variant="secondary" onPress={() => navigation.goBack()} />
    </CaScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bodySemiBold, fontSize: 19, fontWeight: "600", textAlign: "center", marginBottom: 8, color: colors.textPrimary },
  sub: { fontSize: 13, color: colors.textSecondary, textAlign: "center", marginBottom: 26, lineHeight: 19 },
});
