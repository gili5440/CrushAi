import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError } from "../api/client";
import { CaBack } from "../components/CaBack";
import { CaButton } from "../components/CaButton";
import { CaInput } from "../components/CaInput";
import { CaScreen } from "../components/CaScreen";
import { useAuth } from "../context/AuthContext";
import { useResumeAfterAuth } from "../hooks/useResumeAfterAuth";
import { RootStackParamList } from "../navigation/types";
import { colors, fonts, radii } from "../theme";

export function AuthScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signup, login } = useAuth();
  const resume = useResumeAfterAuth();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState(""); // YYYY-MM-DD, derived quickly for MVP
  const [acceptedAge, setAcceptedAge] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit =
    mode === "login"
      ? email.length > 3 && password.length > 0
      : email.length > 3 && password.length >= 8 && acceptedAge;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      if (mode === "signup") {
        // MVP: age-gate via checkbox + a default adult birthdate placeholder; real DOB is collected in onboarding.
        await signup({ email, password, birthDate: birthDate || "2000-01-01", acceptedTerms: true });
        navigation.navigate("Otp", { mode: "signup" });
      } else {
        await login({ email, password });
        resume();
      }
    } catch (err) {
      const message = err instanceof ApiError ? errorMessage(err.body?.error) : "אירעה שגיאה. נסה/נסי שוב.";
      Alert.alert("שגיאה", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <CaScreen>
      <CaBack onPress={() => navigation.goBack()} />
      <Text style={styles.title}>עוד רגע לפני שממשיכים</Text>
      <Text style={styles.tagline}>חשבון קטן, כדי שההתאמות שלך יישמרו והצד השני יוכל לענות לך</Text>

      <View style={styles.toggle}>
        <Pressable style={[styles.toggleBtn, mode === "signup" && styles.toggleBtnActive]} onPress={() => setMode("signup")}>
          <Text style={[styles.toggleText, mode === "signup" && styles.toggleTextActive]}>הרשמה מהירה</Text>
        </Pressable>
        <Pressable style={[styles.toggleBtn, mode === "login" && styles.toggleBtnActive]} onPress={() => setMode("login")}>
          <Text style={[styles.toggleText, mode === "login" && styles.toggleTextActive]}>התחברות</Text>
        </Pressable>
      </View>

      <Text style={styles.fieldLabel}>אימייל</Text>
      <CaInput placeholder="name@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />

      <Text style={styles.fieldLabel}>מספר טלפון</Text>
      <CaInput placeholder="050-1234567" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

      <Text style={styles.fieldLabel}>סיסמה</Text>
      <CaInput placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} />

      {mode === "login" && (
        <Pressable onPress={() => navigation.navigate("Forgot")}>
          <Text style={styles.forgot}>שכחת סיסמה?</Text>
        </Pressable>
      )}

      {mode === "signup" && (
        <Pressable style={styles.termsRow} onPress={() => setAcceptedAge((v) => !v)}>
          <View style={[styles.checkbox, acceptedAge && styles.checkboxChecked]} />
          <Text style={styles.termsText}>אני מאשר/ת שאני מעל גיל 18</Text>
        </Pressable>
      )}

      <CaButton title={mode === "signup" ? "המשך" : "התחברות"} onPress={handleSubmit} disabled={!canSubmit} loading={loading} />

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>או</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialRow}>
        <Pressable style={styles.socialBtn}>
          <Text style={styles.socialText}>Google</Text>
        </Pressable>
        <Pressable style={styles.socialBtn}>
          <Text style={styles.socialText}>Apple</Text>
        </Pressable>
      </View>

      <Text style={styles.legal}>בהמשך את/ה מאשר/ת את תנאי השימוש ומדיניות הפרטיות של CrushAI</Text>
    </CaScreen>
  );
}

function errorMessage(code?: string): string {
  switch (code) {
    case "must_be_18_or_older":
      return "צריך להיות מעל גיל 18 כדי להירשם.";
    case "email_already_registered":
      return "כבר יש חשבון עם האימייל הזה.";
    case "invalid_credentials":
      return "אימייל או סיסמה שגויים.";
    case "account_banned":
      return "החשבון הזה חסום.";
    default:
      return "אירעה שגיאה. נסה/נסי שוב.";
  }
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.displayItalicSemi, fontStyle: "italic", fontSize: 28, fontWeight: "700", textAlign: "center", color: colors.textPrimary, marginTop: 6, marginBottom: 8 },
  tagline: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, textAlign: "center", marginBottom: 24, lineHeight: 20 },
  toggle: { flexDirection: "row", backgroundColor: colors.glassDark, borderWidth: 1, borderColor: colors.glassDarkBorder, borderRadius: radii.pill, padding: 4, marginBottom: 18 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: radii.pill, alignItems: "center" },
  toggleBtnActive: { backgroundColor: colors.accent1 },
  toggleText: { fontFamily: fonts.bodySemiBold, color: colors.textSecondary, fontSize: 13.5, fontWeight: "600" },
  toggleTextActive: { color: colors.btnPrimaryText },
  fieldLabel: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textSecondary, marginBottom: 6, marginTop: 2, marginHorizontal: 2 },
  forgot: { textAlign: "left", fontSize: 12, color: colors.purple400, marginTop: -6, marginBottom: 20 },
  termsRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 20 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: colors.glassDarkBorder, marginTop: 2 },
  checkboxChecked: { backgroundColor: colors.accent2, borderColor: colors.accent2 },
  termsText: { flex: 1, fontSize: 12.5, color: colors.textSecondary, lineHeight: 18 },
  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 22 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.glassDarkBorder },
  dividerText: { color: colors.textMuted, fontSize: 12 },
  socialRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  socialBtn: { flex: 1, height: 50, borderRadius: radii.md, borderWidth: 1, borderColor: colors.glassDarkBorder, backgroundColor: colors.glassDark, alignItems: "center", justifyContent: "center" },
  socialText: { color: colors.textPrimary, fontSize: 13, fontWeight: "500" },
  legal: { textAlign: "center", fontSize: 11, color: colors.textMuted, lineHeight: 17, marginTop: 6 },
});
