import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { api } from "../api/client";
import { CaBack } from "../components/CaBack";
import { CaButton } from "../components/CaButton";
import { CaFieldLabel } from "../components/CaFieldLabel";
import { CaScreen } from "../components/CaScreen";
import { CaTrait } from "../components/CaTrait";
import { getLocalPref, setLocalPref } from "../lib/localPrefs";
import { updateProfilePartial } from "../lib/profile";
import { RootStackParamList } from "../navigation/types";
import { colors, fonts } from "../theme";

const GENDER_OPTIONS = [
  { value: "male", label: "גבר" },
  { value: "female", label: "אישה" },
  { value: "nonbinary", label: "לא בינארי" },
];
const ORIENTATION_OPTIONS = ["סטרייט", "גיי", "לסבית", "ביסקסואל/ית", "פאנסקסואל/ית"];

export function OrientationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [gender, setGender] = useState<string | null>(null);
  const [orientations, setOrientations] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getMyProfile().then((p) => setGender(p.gender));
    getLocalPref<string[]>("orientation", []).then(setOrientations);
  }, []);

  function toggleOrientation(o: string) {
    setOrientations((prev) => (prev.includes(o) ? prev.filter((v) => v !== o) : [...prev, o]));
  }

  async function save() {
    setSaving(true);
    try {
      if (gender) await updateProfilePartial({ gender });
      await setLocalPref("orientation", orientations);
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
      <Text style={styles.title}>מגדר ונטייה מינית</Text>

      <CaFieldLabel>מגדר</CaFieldLabel>
      <View style={styles.grid}>
        {GENDER_OPTIONS.map((o) => (
          <CaTrait key={o.value} label={o.label} selected={gender === o.value} onPress={() => setGender(o.value)} />
        ))}
      </View>

      <CaFieldLabel>נטייה מינית</CaFieldLabel>
      <View style={styles.grid}>
        {ORIENTATION_OPTIONS.map((o) => (
          <CaTrait key={o} label={o} selected={orientations.includes(o)} onPress={() => toggleOrientation(o)} />
        ))}
      </View>

      <CaButton title="שמירה" onPress={save} loading={saving} />
    </CaScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bodySemiBold, fontSize: 19, fontWeight: "600", textAlign: "center", marginBottom: 20, color: colors.textPrimary },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginBottom: 16 },
});
