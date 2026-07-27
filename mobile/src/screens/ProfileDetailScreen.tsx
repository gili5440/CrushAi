import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { api, ApiError, resolveMediaUrl } from "../api/client";
import { CaBack } from "../components/CaBack";
import { CaButton } from "../components/CaButton";
import { CaScreen } from "../components/CaScreen";
import { useAppState } from "../context/AppStateContext";
import { RootStackParamList } from "../navigation/types";
import { ageFromBirthDate } from "../types";
import { colors, radii } from "../theme";

export function ProfileDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<NativeStackScreenProps<RootStackParamList, "ProfileDetail">["route"]>();
  const { profile } = route.params;
  const { removeFromResults } = useAppState();
  const [sending, setSending] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  async function sendChatRequest() {
    setSending(true);
    try {
      const result = await api.createMatch(profile.profile_id);
      removeFromResults(profile.profile_id);
      navigation.navigate("Match", { profile });
      void result;
    } catch (err) {
      if (err instanceof ApiError && err.status === 403 && err.body?.error === "daily_limit_reached") {
        setShowLimitModal(true);
      } else {
        Alert.alert("שגיאה", "לא הצלחנו לשלוח את בקשת הצ'אט. נסה/נסי שוב.");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <CaScreen>
      <CaBack label="← חזרה לתוצאות" onPress={() => navigation.goBack()} />

      {profile.primary_photo_url ? (
        <Image source={{ uri: resolveMediaUrl(profile.primary_photo_url) }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.heroPlaceholder]} />
      )}

      <Text style={styles.name}>
        {profile.display_name}, {ageFromBirthDate(profile.birth_date)}
      </Text>
      {profile.region ? <Text style={styles.sub}>{profile.region}</Text> : null}

      <View style={styles.linksRow}>
        <Pressable onPress={() => Alert.alert("דיווח נשלח")}>
          <Text style={styles.linkMuted}>דיווח</Text>
        </Pressable>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.linkDanger}>חסימה</Text>
        </Pressable>
      </View>

      <View style={styles.actionRow}>
        <View style={{ flex: 1 }}>
          <CaButton title="שמור למועדפים" variant="secondary" onPress={() => navigation.goBack()} />
        </View>
        <View style={{ flex: 1 }}>
          <CaButton title="שלח בקשת צ׳אט" onPress={sendChatRequest} loading={sending} />
        </View>
      </View>

      {showLimitModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.limitCard}>
            <Text style={styles.limitIcon}>💬</Text>
            <Text style={styles.limitTitle}>הגעת למגבלת ההודעות היומית</Text>
            <Text style={styles.limitMsg}>
              בגרסה החינמית אפשר לפתוח שיחה חדשה עם עד 3 משתמשים ביום. שיחות פתוחות ממשיכות כרגיל.
            </Text>
            <CaButton
              title="שדרוג ל-Premium — הודעות ללא הגבלה"
              onPress={() => {
                setShowLimitModal(false);
                navigation.navigate("Premium");
              }}
            />
            <CaButton title="אולי מחר" variant="secondary" onPress={() => setShowLimitModal(false)} />
          </View>
        </View>
      )}
    </CaScreen>
  );
}

const styles = StyleSheet.create({
  hero: { height: 320, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.glassDarkBorder },
  heroPlaceholder: { backgroundColor: colors.bg2 },
  name: { fontSize: 20, fontWeight: "600", color: colors.textPrimary },
  sub: { fontSize: 13, color: colors.textSecondary, marginBottom: 8, marginTop: 4 },
  linksRow: { flexDirection: "row", gap: 16, marginTop: 6 },
  linkMuted: { fontSize: 12, color: colors.textMuted },
  linkDanger: { fontSize: 12, color: colors.danger },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  limitCard: {
    width: "100%",
    maxWidth: 290,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.glassDarkBorder,
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
  },
  limitIcon: { fontSize: 34, marginBottom: 10 },
  limitTitle: { fontSize: 16.5, fontWeight: "600", color: colors.textPrimary, marginBottom: 8, textAlign: "center" },
  limitMsg: { fontSize: 13, color: colors.textSecondary, textAlign: "center", lineHeight: 19, marginBottom: 18 },
});
