import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { resolveMediaUrl } from "../api/client";
import { CaButton } from "../components/CaButton";
import { CaScreen } from "../components/CaScreen";
import { useAppState } from "../context/AppStateContext";
import { RootStackParamList } from "../navigation/types";
import { ageFromBirthDate } from "../types";
import { colors, fonts, radii } from "../theme";

export function ResultsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { lastResults, boostActive, removeFromResults, restoreLastRemoved, hasSearched } = useAppState();
  const [justRemoved, setJustRemoved] = React.useState(false);

  function dismiss(profileId: string) {
    removeFromResults(profileId);
    setJustRemoved(true);
  }

  function undo() {
    restoreLastRemoved();
    setJustRemoved(false);
  }

  if (!hasSearched) {
    return (
      <CaScreen scroll={false}>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>עדיין לא חיפשת התאמות</Text>
          <Text style={styles.emptySub}>התחיל/י חיפוש חדש מהעמוד הראשי</Text>
          <CaButton title="חיפוש חדש" onPress={() => navigation.navigate("MainTabs", { screen: "Home" })} />
        </View>
      </CaScreen>
    );
  }

  return (
    <CaScreen scroll={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{lastResults.length} התאמות נמצאו</Text>
      </View>

      <View style={styles.filterRow}>
        <Pressable style={styles.chip} onPress={() => navigation.navigate("Discovery")}>
          <Text style={styles.chipText}>+ פילטרים</Text>
        </Pressable>
        {boostActive && (
          <Pressable style={styles.chip} onPress={() => navigation.navigate("Boost")}>
            <Text style={[styles.chipText, { color: colors.gold }]}>⚡ Boost פעיל</Text>
          </Pressable>
        )}
      </View>

      {lastResults.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>לא נמצאו התאמות עדיין</Text>
          <Text style={styles.emptySub}>נסה/נסי תמונת השראה אחרת, או הרחיבי את החיפוש</Text>
          <CaButton title="חיפוש חדש" onPress={() => navigation.navigate("MainTabs", { screen: "Home" })} />
        </View>
      ) : (
        <FlatList
          data={lastResults}
          keyExtractor={(item) => item.profile_id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => navigation.navigate("ProfileDetail", { profile: item })}>
              {item.primary_photo_url ? (
                <Image source={{ uri: resolveMediaUrl(item.primary_photo_url) }} style={styles.cardPhoto} />
              ) : (
                <View style={[styles.cardPhoto, styles.cardPhotoPlaceholder]} />
              )}
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>
                  {item.display_name}, {ageFromBirthDate(item.birth_date)}
                </Text>
                {item.region ? <Text style={styles.cardMeta}>{item.region}</Text> : null}
              </View>
              <Pressable style={styles.dismissBtn} onPress={() => dismiss(item.profile_id)} hitSlop={8}>
                <Text style={styles.dismissText}>✕</Text>
              </Pressable>
            </Pressable>
          )}
        />
      )}

      {justRemoved && (
        <Pressable style={styles.undoPill} onPress={undo}>
          <Text style={styles.undoText}>↺ בטל פעולה אחרונה</Text>
        </Pressable>
      )}
    </CaScreen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 22, paddingTop: 16 },
  title: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  filterRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", paddingHorizontal: 22, marginTop: 10, marginBottom: 4 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: colors.glassDark,
    borderWidth: 1,
    borderColor: colors.glassDarkBorder,
    borderRadius: radii.pill,
  },
  chipText: { fontSize: 13, color: colors.textPrimary },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
    padding: 10,
    marginBottom: 12,
    borderRadius: radii.md + 2,
    backgroundColor: colors.glassDark,
    borderWidth: 1,
    borderColor: colors.glassDarkBorder,
  },
  cardPhoto: { width: 78, height: 78, borderRadius: 14 },
  cardPhotoPlaceholder: { backgroundColor: colors.bg2 },
  cardBody: { flex: 1, justifyContent: "center", gap: 4 },
  cardName: { fontFamily: fonts.bodySemiBold, fontSize: 14.5, fontWeight: "600", color: colors.textPrimary },
  cardMeta: { fontSize: 12, color: colors.textSecondary },
  dismissBtn: { alignSelf: "center", padding: 6 },
  dismissText: { color: colors.textMuted, fontSize: 16 },
  empty: { alignItems: "center", paddingTop: 90, paddingHorizontal: 30 },
  emptyIcon: { fontSize: 38, marginBottom: 14 },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: colors.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: "center", marginBottom: 22 },
  undoPill: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(16,10,30,0.9)",
    borderWidth: 1,
    borderColor: colors.glassDarkBorder,
    borderRadius: radii.pill,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  undoText: { fontSize: 12.5, color: colors.textSecondary },
});
