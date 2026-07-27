import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { api, ApiError } from "../api/client";
import { CaButton } from "../components/CaButton";
import { CaFieldLabel } from "../components/CaFieldLabel";
import { CaInput } from "../components/CaInput";
import { CaRangeSlider } from "../components/CaRangeSlider";
import { CaScreen } from "../components/CaScreen";
import { CaSegmented } from "../components/CaSegmented";
import { CaStepDots } from "../components/CaStepDots";
import { CaTextarea } from "../components/CaTextarea";
import { CaTrait } from "../components/CaTrait";
import { useAuth } from "../context/AuthContext";
import { colors, fonts } from "../theme";

const LIFESTYLE_OPTIONS = ["טיולים", "בישול", "ספורט", "מוזיקה", "אמנות", "קפה", "כלבים", "יוגה", "סרטים", "קריאה", "טכנולוגיה", "חוץ"];
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

function birthDateFromAge(age: number): string {
  const year = new Date().getFullYear() - age;
  return `${year}-01-01`;
}

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { markProfileComplete } = useAuth();
  const [step, setStep] = useState<0 | 1 | 2>(0);

  const [mainPhotoUri, setMainPhotoUri] = useState<string | null>(null);
  const [extraPhotos, setExtraPhotos] = useState<(string | null)[]>([null, null, null]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [interestedIn, setInterestedIn] = useState<string | null>(null);
  const [religion, setReligion] = useState<string | null>(null);
  const [age, setAge] = useState("");
  const [region, setRegion] = useState("");
  const [bio, setBio] = useState("");
  const [heightCm, setHeightCm] = useState([175]);
  const [occupation, setOccupation] = useState("");
  const [intent, setIntent] = useState<string | null>(null);
  const [smoking, setSmoking] = useState<string | null>(null);

  const [tags, setTags] = useState<string[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [saving, setSaving] = useState(false);

  async function pickPhoto(setter: (uri: string) => void) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("אין הרשאה", "צריך לאשר גישה לתמונות.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled && result.assets[0]) setter(result.assets[0].uri);
  }

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  const step1Valid = !!mainPhotoUri;
  const step2Valid = !!displayName && !!gender && !!interestedIn && !!age && Number(age) >= 18;
  const step3Valid = acceptedTerms;

  async function handleFinish() {
    if (!step2Valid) {
      Alert.alert("חסרים פרטים", "יש למלא שם, מין, העדפה וגיל (18+).");
      return;
    }
    setSaving(true);
    try {
      await api.updateMyProfile({
        displayName,
        birthDate: birthDateFromAge(Number(age)),
        gender,
        interestedIn,
        region: region || undefined,
        bio: bio || undefined,
        heightCm: heightCm[0],
        religion: religion || undefined,
        smoking: (smoking as any) || undefined,
        lookingFor: intent || undefined,
        lifestyleTags: tags,
      });

      if (mainPhotoUri) {
        setUploadingPhoto(true);
        await api.uploadProfilePhoto(mainPhotoUri);
      }
      for (const uri of extraPhotos) {
        if (uri) await api.uploadProfilePhoto(uri);
      }
      setUploadingPhoto(false);

      markProfileComplete();
      onDone();
    } catch (err) {
      const msg = err instanceof ApiError ? errorMessage(err.body?.error) : "שגיאה לא צפויה";
      Alert.alert("שגיאה בשמירת הפרופיל", msg);
    } finally {
      setSaving(false);
      setUploadingPhoto(false);
    }
  }

  return (
    <CaScreen>
      <CaStepDots count={3} activeIndex={step} />

      {step === 0 && (
        <View>
          <Text style={styles.stepTitle}>הוספת תמונות</Text>
          <Text style={styles.stepSub}>תמונה ראשית ברורה עוזרת ל-AI למצוא לך התאמות מדויקות</Text>

          <Pressable style={styles.mainPhoto} onPress={() => pickPhoto(setMainPhotoUri)}>
            {mainPhotoUri ? (
              <Image source={{ uri: mainPhotoUri }} style={styles.mainPhotoImage} />
            ) : (
              <Text style={styles.mainPhotoPlaceholder}>בחירת{"\n"}תמונה ראשית</Text>
            )}
          </Pressable>

          <View style={styles.photoGrid}>
            {extraPhotos.map((uri, idx) => (
              <Pressable
                key={idx}
                style={styles.photoSlot}
                onPress={() =>
                  pickPhoto((picked) =>
                    setExtraPhotos((prev) => prev.map((p, i) => (i === idx ? picked : p)))
                  )
                }
              >
                {uri ? <Image source={{ uri }} style={styles.photoSlotImage} /> : <Text style={styles.photoSlotPlus}>+</Text>}
              </Pressable>
            ))}
          </View>

          <CaFieldLabel>שם תצוגה</CaFieldLabel>
          <CaInput placeholder="שם תצוגה" value={displayName} onChangeText={setDisplayName} />

          <CaButton title="הבא" onPress={() => setStep(1)} disabled={!step1Valid || !displayName} />
        </View>
      )}

      {step === 1 && (
        <View>
          <Text style={styles.stepTitle}>קצת עליך</Text>
          <Text style={styles.stepSub}>כמה פרטים בסיסיים שיופיעו בפרופיל שלך</Text>

          <CaFieldLabel>מין</CaFieldLabel>
          <CaSegmented
            options={[{ value: "male", label: "זכר" }, { value: "female", label: "נקבה" }]}
            value={gender}
            onChange={setGender}
          />

          <CaFieldLabel>מעוניין/ת להכיר</CaFieldLabel>
          <CaSegmented
            options={[{ value: "men", label: "גברים" }, { value: "women", label: "נשים" }]}
            value={interestedIn}
            onChange={setInterestedIn}
          />

          <CaFieldLabel>רמת דתיות</CaFieldLabel>
          <CaSegmented
            options={[
              { value: "secular", label: "חילוני" },
              { value: "traditional", label: "מסורתי" },
              { value: "religious", label: "דתי" },
            ]}
            value={religion}
            onChange={setReligion}
          />

          <CaFieldLabel>גיל</CaFieldLabel>
          <CaInput placeholder="27" keyboardType="number-pad" value={age} onChangeText={(t) => setAge(t.replace(/\D/g, "").slice(0, 2))} />

          <CaFieldLabel>עיר מגורים</CaFieldLabel>
          <CaInput placeholder="תל אביב" value={region} onChangeText={setRegion} />

          <CaFieldLabel>כמה מילים על עצמך</CaFieldLabel>
          <CaTextarea placeholder="לדוגמה: אוהב/ת טיולים, קפה טוב וימי שישי רגועים..." value={bio} onChangeText={setBio} />

          <CaFieldLabel>הגובה שלי הוא</CaFieldLabel>
          <CaRangeSlider min={150} max={205} values={heightCm} onChange={setHeightCm} label={`${(heightCm[0] / 100).toFixed(2)} מ'`} />

          <CaFieldLabel>עיסוק</CaFieldLabel>
          <CaInput placeholder="לדוגמה: מפתחת תוכנה" value={occupation} onChangeText={setOccupation} />

          <CaFieldLabel>מה באת לחפש?</CaFieldLabel>
          <View style={styles.traitGrid}>
            {INTENT_OPTIONS.map((o) => (
              <CaTrait key={o.value} label={o.label} selected={intent === o.value} onPress={() => setIntent(o.value)} />
            ))}
          </View>

          <CaFieldLabel>מעשן/ת?</CaFieldLabel>
          <View style={styles.traitGrid}>
            {SMOKE_OPTIONS.map((o) => (
              <CaTrait key={o.value} label={o.label} selected={smoking === o.value} onPress={() => setSmoking(o.value)} />
            ))}
          </View>

          <View style={styles.navRow}>
            <View style={styles.navBtn}>
              <CaButton title="חזרה" variant="secondary" onPress={() => setStep(0)} />
            </View>
            <View style={styles.navBtn}>
              <CaButton title="הבא" onPress={() => setStep(2)} disabled={!step2Valid} />
            </View>
          </View>
        </View>
      )}

      {step === 2 && (
        <View>
          <Text style={styles.stepTitle}>מה מאפיין אותך</Text>
          <Text style={styles.stepSub}>בחר/י כמה תגיות — זה עוזר למצוא התאמות טובות יותר</Text>

          <View style={styles.traitGrid}>
            {LIFESTYLE_OPTIONS.map((tag) => (
              <CaTrait key={tag} label={tag} selected={tags.includes(tag)} onPress={() => toggleTag(tag)} />
            ))}
          </View>

          <Pressable style={styles.termsRow} onPress={() => setAcceptedTerms((v) => !v)}>
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]} />
            <Text style={styles.termsText}>קראתי ואני מאשר/ת את תנאי השימוש ואת מדיניות הפרטיות של CrushAI</Text>
          </Pressable>

          <View style={styles.navRow}>
            <View style={styles.navBtn}>
              <CaButton title="חזרה" variant="secondary" onPress={() => setStep(1)} />
            </View>
            <View style={styles.navBtn}>
              <CaButton title={uploadingPhoto ? "מעלה תמונה..." : "סיום"} onPress={handleFinish} disabled={!step3Valid} loading={saving} />
            </View>
          </View>
        </View>
      )}
    </CaScreen>
  );
}

function errorMessage(code?: string): string {
  if (code === "must_be_18_or_older") return "צריך להיות מעל גיל 18.";
  return code ?? "שגיאה לא צפויה";
}

const styles = StyleSheet.create({
  stepTitle: { fontFamily: fonts.bodySemiBold, fontSize: 19, fontWeight: "600", textAlign: "center", marginBottom: 8, color: colors.textPrimary },
  stepSub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: "center", marginBottom: 28 },
  mainPhoto: {
    width: 150,
    height: 150,
    alignSelf: "center",
    marginBottom: 20,
    borderRadius: 75,
    borderWidth: 1.5,
    borderColor: colors.glassDarkBorder,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.glassDark,
    overflow: "hidden",
  },
  mainPhotoImage: { width: "100%", height: "100%" },
  mainPhotoPlaceholder: { color: colors.textMuted, fontSize: 13, textAlign: "center" },
  photoGrid: { flexDirection: "row", gap: 10, marginBottom: 16 },
  photoSlot: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.glassDarkBorder,
    borderStyle: "dashed",
    backgroundColor: colors.glassDark,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoSlotImage: { width: "100%", height: "100%" },
  photoSlotPlus: { color: colors.textMuted, fontSize: 22 },
  traitGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginBottom: 16 },
  navRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  navBtn: { flex: 1 },
  termsRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 22, marginBottom: 6 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: colors.glassDarkBorder, marginTop: 2 },
  checkboxChecked: { backgroundColor: colors.accent2, borderColor: colors.accent2 },
  termsText: { flex: 1, fontSize: 12.5, color: colors.textSecondary, lineHeight: 19 },
});
