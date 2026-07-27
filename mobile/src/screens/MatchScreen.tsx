import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { api } from "../api/client";
import { CaAvatar } from "../components/CaAvatar";
import { CaBack } from "../components/CaBack";
import { CaButton } from "../components/CaButton";
import { CaScreen } from "../components/CaScreen";
import { GradientText } from "../components/GradientText";
import { RootStackParamList } from "../navigation/types";
import { ageFromBirthDate } from "../types";
import { colors, fonts } from "../theme";

export function MatchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<NativeStackScreenProps<RootStackParamList, "Match">["route"]>();
  const { profile } = route.params;
  const [loading, setLoading] = useState(false);

  async function goToChat() {
    setLoading(true);
    try {
      // GET /matches is ordered by most recent activity — the match we just created is first.
      const { matches } = await api.getMatches();
      const mostRecent = matches[0];
      if (mostRecent) {
        navigation.navigate("Chatroom", {
          matchId: mostRecent.id,
          name: `${profile.display_name}, ${ageFromBirthDate(profile.birth_date)}`,
          avatarSeed: profile.display_name,
        });
      } else {
        Alert.alert("שגיאה", "לא נמצאה השיחה.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <CaScreen>
      <CaBack onPress={() => navigation.goBack()} />
      <View style={styles.wrap}>
        <View style={styles.avatars}>
          <CaAvatar seed="Me" size={100} borderColor={colors.accent2} />
          <CaAvatar seed={profile.display_name} size={100} borderColor={colors.accent1} />
        </View>
        <GradientText style={styles.title}>יש התאמה!</GradientText>
        <Text style={styles.sub}>
          את/ה ו{profile.display_name} עכשיו יכולים לשוחח. תתחיל/י לספר קצת על עצמך.
        </Text>
        <CaButton title="שליחת הודעה ראשונה" onPress={goToChat} loading={loading} />
        <CaButton title="להמשיך לחפש" variant="secondary" onPress={() => navigation.navigate("MainTabs", { screen: "Results" })} />
      </View>
    </CaScreen>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingTop: 40 },
  avatars: { flexDirection: "row", gap: -20, marginBottom: 20 },
  title: { fontFamily: fonts.displayItalicSemi, fontStyle: "italic", fontSize: 30, marginBottom: 10 },
  sub: { fontSize: 13, color: colors.textSecondary, textAlign: "center", marginBottom: 20, lineHeight: 20, paddingHorizontal: 10 },
});
