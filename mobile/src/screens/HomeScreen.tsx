import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import React from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { CaAvatar } from "../components/CaAvatar";
import { CaBell } from "../components/CaBell";
import { CaButton } from "../components/CaButton";
import { CaHeroLens } from "../components/CaHeroLens";
import { CaScreen } from "../components/CaScreen";
import { CaSectionHead } from "../components/CaSectionHead";
import { GradientText } from "../components/GradientText";
import { useAppState } from "../context/AppStateContext";
import { useAuthGate } from "../hooks/useAuthGate";
import { RootStackParamList } from "../navigation/types";
import { colors, fonts, radii } from "../theme";

const SUGGESTION_AVATARS = ["Dana", "Tom", "Maya", "Itay", "Noa"];
const RECENT_STYLE_CHIPS = ["סטייל ספורטיבי", "שיער כהה, זקן קצר"];

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { hasSearched } = useAppState();
  const requireAuth = useAuthGate();

  async function pickInspirationPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("אין הרשאה", "צריך לאשר גישה לתמונות כדי להעלות תמונת השראה.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;

    const photoUri = result.assets[0].uri;
    requireAuth({ kind: "visualSearch", photoUri }, () => {
      navigation.navigate("Analyzing", { source: "visual", photoUri });
    });
  }

  function startQuiz() {
    navigation.navigate("Quiz");
  }

  return (
    <CaScreen>
      <CaBell onPress={() => navigation.navigate("Inbox")} />

      <GradientText style={styles.wordmark}>CrushAI</GradientText>
      <Text style={styles.tagline}>חיפוש ויזואלי חכם להתאמות מדויקות</Text>

      <CaHeroLens />

      <CaButton
        title="העלאת תמונה למציאת התאמות"
        micro="ה-AI ימצא עבורך משתמשים באפליקציה בעלי מראה וסטייל דומה"
        onPress={pickInspirationPhoto}
      />

      <CaButton title="חיפוש לפי מאפיינים ואישיות" variant="secondary" onPress={startQuiz} />

      <CaSectionHead>{hasSearched ? "חיפושים אחרונים" : "הצעות לחיפוש"}</CaSectionHead>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarRow}>
        <View style={styles.avatarRowInner}>
          {SUGGESTION_AVATARS.map((seed) => (
            <CaAvatar key={seed} seed={seed} size={48} />
          ))}
        </View>
      </ScrollView>

      {hasSearched && (
        <View style={styles.chipRow}>
          {RECENT_STYLE_CHIPS.map((label) => (
            <View key={label} style={styles.chip}>
              <Text style={styles.chipText}>{label}</Text>
            </View>
          ))}
        </View>
      )}
    </CaScreen>
  );
}

const styles = StyleSheet.create({
  wordmark: {
    fontFamily: fonts.displayItalicSemi,
    fontStyle: "italic",
    fontWeight: "700",
    fontSize: 36,
    textAlign: "center",
    marginBottom: 8,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 14.5,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  avatarRow: { marginBottom: 14 },
  avatarRowInner: { flexDirection: "row", gap: 10, paddingVertical: 2 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: colors.glassDark,
    borderWidth: 1,
    borderColor: colors.glassDarkBorder,
    borderRadius: radii.pill,
  },
  chipText: { fontSize: 13, color: colors.textPrimary },
});
