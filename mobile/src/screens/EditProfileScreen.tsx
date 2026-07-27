import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { api } from "../api/client";
import { CaBack } from "../components/CaBack";
import { CaButton } from "../components/CaButton";
import { CaFieldLabel } from "../components/CaFieldLabel";
import { CaInput } from "../components/CaInput";
import { CaRangeSlider } from "../components/CaRangeSlider";
import { CaScreen } from "../components/CaScreen";
import { CaTextarea } from "../components/CaTextarea";
import { CaTrait } from "../components/CaTrait";
import { updateProfilePartial } from "../lib/profile";
import { ageFromBirthDate } from "../types";
import { RootStackParamList } from "../navigation/types";
import { colors, fonts } from "../theme";

const INTENT_OPTIONS = [
  { value: "serious", label: "💍 קשר רציני" },
  { value: "casual_open", label: "☕ נזרום ונראה" },
  { value: "light", label: "🥂 קשר קליל" },
  { value: "marriage", label: "💐 נישואין" },
];
const SMOKE_OPTIONS = [
  { value: "never", label: "🚭 לא" },
  { value: "regularly", label: "🚬 כן" },
  { value: "sometimes", label: "💨 רק באירועים" },
];

export function EditProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loaded, setLoaded] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState("");
  const [region, setRegion] = useState("");
  const [heightCm, setHeightCm] = useState([175]);
  const [occupation, setOccupation] = useState("");
  const [intent, setIntent] = useState<string | null>(null);
  const [smoking, setSmoking] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getMyProfile().then((p) => {
      setDisplayName(p.display_name ?? "");
      setAge(String(ageFromBirthDate(p.birth_date)));
      setRegion(p.region ?? "");
      setHeightCm([p.height_cm ?? 175]);
      setOccupation(p.profession ?? "");
      setIntent(p.looking_for ?? null);
      setSmoking(p.smoking ?? null);
      setBio(p.bio ?? "");
      setLoaded(true);
    });
  }, []);

  async function save() {
    setSaving(true);
    try {
      await updateProfilePartial({
        displayName,
        heightCm: heightCm[0],
        profession: occupation || undefined,
        lookingFor: intent || undefined,
        smoking: smoking || undefined,
        bio: bio || undefined,
        region: region || undefined,
      });
      navigation.navigate("MainTabs", { screen: "Settings" });
    } catch {
      Alert.alert("שגיאה", "לא הצלחנו לשמור. נסה/נסי שוב.");
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return <CaScreen>{null}</CaScreen>;

  return (
    <CaScreen>
      <CaBack onPress={() => navigation.goBack()} />
      <Text style={styles.title}>עריכת פרופיל</Text>

      <CaFieldLabel>שם</CaFieldLabel>
      <CaInput value={displayName} onChangeText={setDisplayName} />

      <CaFieldLabel>גיל</CaFieldLabel>
      <CaInput value={age} editable={false} style={{ opacity: 0.6 }} />

      <CaFieldLabel>עיר מגורים</CaFieldLabel>
      <CaInput value={region} onChangeText={setRegion} />

      <CaFieldLabel>הגובה שלי הוא</CaFieldLabel>
      <CaRangeSlider min={150} max={205} values={heightCm} onChange={setHeightCm} label={`${(heightCm[0] / 100).toFixed(2)} מ'`} />

      <CaFieldLabel>עיסוק</CaFieldLabel>
      <CaInput value={occupation} onChangeText={setOccupation} />

      <CaFieldLabel>מה באת לחפש?</CaFieldLabel>
      <View style={styles.grid}>
        {INTENT_OPTIONS.map((o) => (
          <CaTrait key={o.value} label={o.label} selected={intent === o.value} onPress={() => setIntent(o.value)} />
        ))}
      </View>

      <CaFieldLabel>מעשן/ת?</CaFieldLabel>
      <View style={styles.grid}>
        {SMOKE_OPTIONS.map((o) => (
          <CaTrait key={o.value} label={o.label} selected={smoking === o.value} onPress={() => setSmoking(o.value)} />
        ))}
      </View>

      <CaFieldLabel>כמה מילים על עצמך</CaFieldLabel>
      <CaTextarea value={bio} onChangeText={setBio} />

      <CaButton title="שמירת שינויים" onPress={save} loading={saving} />
    </CaScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bodySemiBold, fontSize: 19, fontWeight: "600", marginBottom: 20, color: colors.textPrimary },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginBottom: 16 },
});
