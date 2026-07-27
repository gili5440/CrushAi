import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { api } from "../api/client";
import { CaBack } from "../components/CaBack";
import { CaButton } from "../components/CaButton";
import { CaScreen } from "../components/CaScreen";
import { CaTrait } from "../components/CaTrait";
import { updateProfilePartial } from "../lib/profile";
import { RootStackParamList } from "../navigation/types";
import { colors, fonts } from "../theme";

const OPTIONS = [
  { value: "men", label: "גברים" },
  { value: "women", label: "נשים" },
  { value: "everyone", label: "כולם" },
];

export function ShowMeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [value, setValue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getMyProfile().then((p) => setValue(p.interested_in));
  }, []);

  async function save() {
    if (!value) return;
    setSaving(true);
    try {
      await updateProfilePartial({ interestedIn: value });
      navigation.goBack();
    } catch {
      Alert.alert("שגיאה", "לא הצלחנו לשמור. נסה/נסי שוב.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CaScreen>
      <CaBack onPress={() => navigation.goBack()} />
      <Text style={styles.title}>מי להראות לי</Text>
      <Text style={styles.sub}>זו ההעדפה שקבעת בהרשמה ("מעוניין/ת להכיר") — אפשר לשנות אותה כאן בכל שלב</Text>
      <View style={styles.grid}>
        {OPTIONS.map((o) => (
          <CaTrait key={o.value} label={o.label} selected={value === o.value} onPress={() => setValue(o.value)} />
        ))}
      </View>
      <CaButton title="שמירה" onPress={save} loading={saving} disabled={!value} />
    </CaScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bodySemiBold, fontSize: 19, fontWeight: "600", textAlign: "center", marginBottom: 8, color: colors.textPrimary },
  sub: { fontSize: 13, color: colors.textSecondary, textAlign: "center", marginBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginBottom: 20 },
});
