import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CaBack } from "../components/CaBack";
import { CaButton } from "../components/CaButton";
import { CaFieldLabel } from "../components/CaFieldLabel";
import { CaPlanCard } from "../components/CaPlanCard";
import { CaRangeSlider } from "../components/CaRangeSlider";
import { CaScreen } from "../components/CaScreen";
import { CaStepDots } from "../components/CaStepDots";
import { CaTrait } from "../components/CaTrait";
import { useAuthGate } from "../hooks/useAuthGate";
import { QuizAnswers, RootStackParamList } from "../navigation/types";
import { colors, fonts } from "../theme";

function SingleChoiceRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ marginBottom: 4 }}>
      <CaFieldLabel>{label}</CaFieldLabel>
      <View style={styles.traitGrid}>
        {options.map((opt) => (
          <CaTrait key={opt} label={opt} selected={value === opt} onPress={() => onChange(opt)} />
        ))}
      </View>
    </View>
  );
}

export function QuizScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const requireAuth = useAuthGate();
  const [step, setStep] = useState<0 | 1>(0);
  const [answers, setAnswers] = useState<QuizAnswers>({ ageMin: 18, ageMax: 65 });

  function set<K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    requireAuth({ kind: "quizSearch", answers }, () => {
      navigation.navigate("Analyzing", { source: "quiz", answers });
    });
  }

  return (
    <CaScreen>
      <CaBack onPress={() => navigation.goBack()} />
      <CaStepDots count={2} activeIndex={step} />

      {step === 0 && (
        <View>
          <Text style={styles.title}>איך נראה מי שאת/ה מחפש/ת</Text>
          <Text style={styles.sub}>בחר/י את המראה החיצוני שמדבר אליך — זה עוזר ל-AI לצמצם את החיפוש</Text>

          <CaFieldLabel>טווח גילאים</CaFieldLabel>
          <CaRangeSlider
            min={18}
            max={65}
            values={[answers.ageMin ?? 18, answers.ageMax ?? 65]}
            onChange={([a, b]) => setAnswers((prev) => ({ ...prev, ageMin: a, ageMax: b }))}
            label={`${answers.ageMin ?? 18} – ${answers.ageMax === 65 ? "65+" : answers.ageMax}`}
          />

          <SingleChoiceRow label="צבע שיער מועדף" options={["שחור", "חום", "בלונד", "אדום", "לא משנה לי"]} value={answers.hair} onChange={(v) => set("hair", v)} />
          <SingleChoiceRow label="צבע עיניים" options={["כחול", "ירוק", "חום", "שחור", "לא משנה לי"]} value={answers.eyes} onChange={(v) => set("eyes", v)} />
          <SingleChoiceRow label="מבנה גוף" options={["רזה", "אתלטי", "ממוצע", "מלא", "לא משנה לי"]} value={answers.body} onChange={(v) => set("body", v)} />
          <SingleChoiceRow label="מחפש/ת בן/בת זוג" options={["דתי/ה", "מסורתי/ת", "חילוני/ת", "לא משנה לי"]} value={answers.religionPref} onChange={(v) => set("religionPref", v)} />
          <SingleChoiceRow label="אזור מגורים מועדף" options={["צפון", "מרכז", "דרום", "לא משנה לי"]} value={answers.regionPref} onChange={(v) => set("regionPref", v)} />

          <CaFieldLabel>טווח גובה</CaFieldLabel>
          <CaPlanCard name="🔒 סינון לפי גובה" sub="פיצ'ר Premium — לחצי כדי לשדרג" onPress={() => navigation.navigate("Premium")} />

          <SingleChoiceRow label="סטטוס עישון" options={["🚭 לא", "🚬 כן", "💨 רק באירועים", "לא משנה לי"]} value={answers.smoking} onChange={(v) => set("smoking", v)} />
          <SingleChoiceRow label="מטרת קשר" options={["💍 קשר רציני", "☕ נזרום ונראה", "🥂 קשר קליל", "💐 נישואין"]} value={answers.goal} onChange={(v) => set("goal", v)} />

          <View style={styles.navRow}>
            <CaButton title="הבא" onPress={() => setStep(1)} />
          </View>
        </View>
      )}

      {step === 1 && (
        <View>
          <Text style={styles.title}>קצת על האישיות</Text>
          <Text style={styles.sub}>כמה שאלות קצרות שיעזרו למצוא התאמה אמיתית, לא רק חזותית</Text>

          <SingleChoiceRow label="איך מעדיפ/ה לבלות ערב פנוי?" options={["סרט בבית", "מסיבה עם חברים", "טיול בטבע", "מסעדה חדשה"]} value={answers.evening} onChange={(v) => set("evening", v)} />
          <SingleChoiceRow label="מה הכי חשוב לך בבן/בת זוג?" options={["חוש הומור", "כנות", "אמביציה", "רוגע ויציבות"]} value={answers.value} onChange={(v) => set("value", v)} />
          <SingleChoiceRow label="את/ה יותר..." options={["ספונטני/ת", "מתכנן/ת מסודר/ת"]} value={answers.plan} onChange={(v) => set("plan", v)} />
          <SingleChoiceRow label="בקונפליקט את/ה..." options={["מדבר/ת ישר", "צריך/ה זמן לעכל"]} value={answers.conflict} onChange={(v) => set("conflict", v)} />

          <View style={styles.navRow}>
            <View style={styles.navBtn}>
              <CaButton title="חזרה" variant="secondary" onPress={() => setStep(0)} />
            </View>
            <View style={styles.navBtn}>
              <CaButton title="מצא לי התאמות" onPress={submit} />
            </View>
          </View>
        </View>
      )}
    </CaScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bodySemiBold, fontSize: 19, fontWeight: "600", textAlign: "center", marginBottom: 8, color: colors.textPrimary },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: "center", marginBottom: 26 },
  traitGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginBottom: 16 },
  navRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  navBtn: { flex: 1 },
});
