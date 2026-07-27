import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { api, resolveMediaUrl } from "../api/client";
import { CaAvatar } from "../components/CaAvatar";
import { CaButton } from "../components/CaButton";
import { CaScreen } from "../components/CaScreen";
import { CaSectionHead } from "../components/CaSectionHead";
import { CaSettingsRow } from "../components/CaSettingsRow";
import { CaTrait } from "../components/CaTrait";
import { useAppState } from "../context/AppStateContext";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../navigation/types";
import { colors } from "../theme";

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { logout } = useAuth();
  const { verifiedProfile, isPremium } = useAppState();
  const [profile, setProfile] = useState<any>(null);
  const [lang, setLang] = useState<"he" | "en">("he");

  useFocusEffect(
    useCallback(() => {
      api.getMyProfile().then(setProfile).catch(() => {});
    }, [])
  );

  async function handleLogout() {
    await logout();
  }

  function handleDeleteRow() {
    navigation.navigate("DeleteAccount");
  }

  return (
    <CaScreen>
      <CaSectionHead style={{ marginTop: 0 }}>הפרופיל שלי</CaSectionHead>

      <View style={styles.hero}>
        <CaAvatar size={64} uri={profile?.photos?.[0] ? resolveMediaUrl(profile.photos[0].storage_url) : undefined} seed={profile?.display_name} />
        <View>
          <Text style={styles.name}>{profile?.display_name ?? "…"}</Text>
          <Text style={styles.sub}>{profile?.region ?? ""}</Text>
          {verifiedProfile && (
            <View style={[styles.badge, styles.badgeVerified]}>
              <Text style={styles.badgeTextVerified}>✓ פרופיל מאומת</Text>
            </View>
          )}
          {isPremium && (
            <View style={[styles.badge, styles.badgePremium]}>
              <Text style={styles.badgeTextPremium}>★ Premium</Text>
            </View>
          )}
        </View>
      </View>

      <CaSettingsRow label="אימות פרופיל (ID + תמונה)" onPress={() => navigation.navigate("Verify")} />
      <CaSettingsRow label="שפה / Language" />
      <View style={styles.langRow}>
        <View style={{ flex: 1 }}>
          <CaTrait label="עברית" selected={lang === "he"} onPress={() => setLang("he")} />
        </View>
        <View style={{ flex: 1 }}>
          <CaTrait label="English" selected={lang === "en"} onPress={() => setLang("en")} />
        </View>
      </View>

      <CaSectionHead>גילוי (Discovery)</CaSectionHead>
      <CaSettingsRow label="מרחק וטווח גילאים" onPress={() => navigation.navigate("Discovery")} />
      <CaSettingsRow label="מי להראות לי" onPress={() => navigation.navigate("ShowMe")} />
      <CaSettingsRow label="תחומי עניין" onPress={() => navigation.navigate("Interests")} />
      <CaSettingsRow label="מגדר ונטייה מינית" onPress={() => navigation.navigate("Orientation")} />

      <CaSectionHead>חשבון</CaSectionHead>
      <CaSettingsRow label="עריכת פרופיל" onPress={() => navigation.navigate("EditProfile")} />
      <CaSettingsRow label="הסתרת הפרופיל שלי" />
      <CaSettingsRow label="ניהול התראות" />
      <CaSettingsRow label="מנוי Premium" onPress={() => navigation.navigate("Premium")} />
      <CaSettingsRow label="הזמנת חברים" onPress={() => navigation.navigate("Invite")} />

      <CaSectionHead>פרטיות ותמיכה</CaSectionHead>
      <CaSettingsRow label="בטיחות ותמיכה" onPress={() => navigation.navigate("Safety")} />
      <CaSettingsRow label="בקשת עותק מהמידע שלי" onPress={() => Alert.alert("הבקשה נשלחה", "נשלח אליך קובץ עם כל המידע תוך 30 יום.")} />
      <CaSettingsRow label="מחיקת חשבון" danger onPress={handleDeleteRow} />

      <CaButton title="התנתקות" variant="secondary" onPress={handleLogout} />
    </CaScreen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 10 },
  name: { fontSize: 17, fontWeight: "600", color: colors.textPrimary },
  sub: { fontSize: 12.5, color: colors.textSecondary },
  badge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 },
  badgeVerified: { backgroundColor: "rgba(90,200,140,0.15)", borderWidth: 1, borderColor: "rgba(90,200,140,0.4)" },
  badgeTextVerified: { fontSize: 11, color: "#7EE0AE" },
  badgePremium: { backgroundColor: "rgba(232,196,122,0.15)", borderWidth: 1, borderColor: "rgba(232,196,122,0.4)" },
  badgeTextPremium: { fontSize: 11, color: colors.gold },
  langRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
});
