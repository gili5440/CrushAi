import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { api } from "../api/client";
import { CaBack } from "../components/CaBack";
import { CaButton } from "../components/CaButton";
import { CaPlanCard } from "../components/CaPlanCard";
import { CaScreen } from "../components/CaScreen";
import { GradientText } from "../components/GradientText";
import { useAppState } from "../context/AppStateContext";
import { RootStackParamList } from "../navigation/types";
import { colors, fonts } from "../theme";

type Plan = "weekly" | "monthly" | "yearly";

const CTA_LABEL: Record<Plan, string> = {
  weekly: "המשך עם השבועי — ₪19 / שבוע",
  monthly: "המשך עם החודשי — ₪39 / חודש",
  yearly: "המשך עם השנתי — ₪299 / שנה",
};

const FEATURES = [
  "חיפושי AI ללא הגבלה ביום",
  "הודעות ללא הגבלה למשתמשים חדשים",
  "עד 5 תמונות השראה בחיפוש אחד",
  "פילטרים מתקדמים (גובה, השכלה)",
  "ראיית מי חיפש בסטייל שלך",
  "Boost חודשי חינם",
  "גלישה במצב Incognito",
];

export function PremiumScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { setPremium } = useAppState();
  const [plan, setPlan] = useState<Plan>("monthly");
  const [loading, setLoading] = useState(false);

  async function purchase() {
    setLoading(true);
    try {
      await api.purchaseSubscription(plan);
      setPremium(true);
      Alert.alert("ברוך/ה הבא/ה ל-Premium!", "", [{ text: "מעולה", onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert("שגיאה", "לא הצלחנו להשלים את הרכישה. נסה/נסי שוב.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <CaScreen>
      <CaBack onPress={() => navigation.goBack()} />
      <Text style={styles.title}>
        CrushAI <GradientText style={styles.titleGradient}>Premium</GradientText>
      </Text>
      <Text style={styles.sub}>חיפושי AI ללא הגבלה, פילטרים מתקדמים, ועדיפות בתוצאות</Text>

      <CaPlanCard name="שבועי" sub="חיוב כל שבוע" price="₪19" priceSuffix=" / שבוע" selected={plan === "weekly"} onPress={() => setPlan("weekly")} />
      <CaPlanCard
        name="חודשי"
        sub="חיוב כל חודש · ביטול בכל עת"
        price="₪39"
        priceSuffix=" / חודש"
        badge="הכי פופולרי"
        selected={plan === "monthly"}
        onPress={() => setPlan("monthly")}
      />
      <CaPlanCard
        name="שנתי"
        sub="₪25 לחודש · חיוב שנתי אחד"
        price="₪299"
        priceSuffix=" / שנה"
        badge="חסכון של 36%"
        badgeColors={["#8A6CFF", "#A98CFF"]}
        selected={plan === "yearly"}
        onPress={() => setPlan("yearly")}
      />

      <Text style={styles.legal}>
        המחירים נמוכים בכוונה ממחירי Tinder — כמוצר חדש בשוק, תמחור חדירה (Penetration Pricing) עוזר לצבור בסיס משתמשים
        ראשוני לפני העלאת מחירים בהמשך.
      </Text>

      <Text style={styles.featuresTitle}>מה כלול</Text>
      {FEATURES.map((f) => (
        <View key={f} style={styles.featureRow}>
          <Text style={styles.check}>✓</Text>
          <Text style={styles.featureText}>{f}</Text>
        </View>
      ))}

      <CaButton title={CTA_LABEL[plan]} onPress={purchase} loading={loading} />
      <Text style={styles.legal}>החיוב מתבצע דרך App Store / Google Play, ומתחדש אוטומטית עד לביטול בהגדרות החשבון.</Text>
    </CaScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bodySemiBold, fontSize: 19, fontWeight: "600", textAlign: "center", marginBottom: 8, color: colors.textPrimary },
  titleGradient: { fontFamily: fonts.bodySemiBold, fontSize: 19, fontWeight: "600" },
  sub: { fontSize: 13, color: colors.textSecondary, textAlign: "center", marginBottom: 22 },
  legal: { textAlign: "center", fontSize: 11, color: colors.textMuted, lineHeight: 17, marginBottom: 14, marginTop: 2 },
  featuresTitle: { fontSize: 13, color: colors.textSecondary, marginVertical: 14 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9 },
  check: { color: "#7EE0AE", fontSize: 15 },
  featureText: { fontSize: 13, color: colors.textSecondary },
});
