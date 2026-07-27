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

const OPTIONS = ["טיולים", "בישול", "ספורט", "מוזיקה", "אמנות", "קפה", "כלבים", "יוגה", "סרטים", "קריאה", "טכנולוגיה", "חוץ"];

export function InterestsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getMyProfile().then((p) => setTags(p.lifestyle_tags ?? []));
  }, []);

  function toggle(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function save() {
    setSaving(true);
    try {
      await updateProfilePartial({ lifestyleTags: tags });
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
      <Text style={styles.title}>תחומי עניין</Text>
      <Text style={styles.sub}>בחר/י כמה תגיות שמתארות אותך</Text>
      <View style={styles.grid}>
        {OPTIONS.map((tag) => (
          <CaTrait key={tag} label={tag} selected={tags.includes(tag)} onPress={() => toggle(tag)} />
        ))}
      </View>
      <CaButton title="שמירה" onPress={save} loading={saving} />
    </CaScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bodySemiBold, fontSize: 19, fontWeight: "600", textAlign: "center", marginBottom: 8, color: colors.textPrimary },
  sub: { fontSize: 13, color: colors.textSecondary, textAlign: "center", marginBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginBottom: 20 },
});
