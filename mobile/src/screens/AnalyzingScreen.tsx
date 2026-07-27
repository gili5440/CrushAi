import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { api, ApiError } from "../api/client";
import { CaScreen } from "../components/CaScreen";
import { useAppState } from "../context/AppStateContext";
import { RootStackParamList } from "../navigation/types";
import { colors, fonts } from "../theme";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function AnalyzingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<NativeStackScreenProps<RootStackParamList, "Analyzing">["route"]>();
  const { setLastSearch, markSearched } = useAppState();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const params = route.params;
        const [response] = await Promise.all([
          params.source === "visual" ? api.searchVisual(params.photoUri, {}) : api.searchTraits(params.answers),
          delay(1400),
        ]);
        if (cancelled) return;
        setLastSearch(response.searchId, response.results);
        markSearched();
        navigation.navigate("MainTabs", { screen: "Results" });
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof ApiError && err.status === 502
            ? "שירות ה-AI לא זמין כרגע. ודא/י שהוא רץ."
            : "לא הצלחנו להריץ את החיפוש. נסה/נסי שוב.";
        Alert.alert("שגיאה", msg);
        navigation.goBack();
      }
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CaScreen scroll={false}>
      <View style={styles.wrap}>
        <View style={styles.scanFrame} />
        <Text style={styles.text}>
          מנתחים את <Text style={styles.bold}>מאפייני הסטייל</Text>
          {"\n"}ומחפשים התאמות...
        </Text>
      </View>
    </CaScreen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30 },
  scanFrame: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: "#8f8fa8",
    backgroundColor: colors.bg2,
    marginBottom: 26,
  },
  text: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 20 },
  bold: { fontFamily: fonts.bodySemiBold, color: colors.accent2, fontWeight: "600" },
});
