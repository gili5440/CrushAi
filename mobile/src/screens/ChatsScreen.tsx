import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "../api/client";
import { CaAvatar } from "../components/CaAvatar";
import { CaScreen } from "../components/CaScreen";
import { CaSectionHead } from "../components/CaSectionHead";
import { RootStackParamList } from "../navigation/types";
import { colors, fonts } from "../theme";

type MatchRow = {
  id: string;
  display_name: string;
  primary_photo_url: string | null;
  last_message: string | null;
};

export function ChatsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      api
        .getMatches()
        .then((res) => {
          if (!cancelled) setMatches(res.matches);
        })
        .finally(() => !cancelled && setLoading(false));
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return (
    <CaScreen scroll={false}>
      <View style={{ paddingHorizontal: 22, paddingTop: 16 }}>
        <CaSectionHead style={{ marginTop: 0 }}>הצ׳אטים שלי</CaSectionHead>
      </View>

      {!loading && matches.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>עדיין אין שיחות</Text>
          <Text style={styles.emptySub}>כשתתאימו למישהו, השיחה תופיע כאן</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => navigation.navigate("Chatroom", { matchId: item.id, name: item.display_name, avatarSeed: item.display_name })}
            >
              <CaAvatar seed={item.display_name} uri={item.primary_photo_url ?? undefined} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.display_name}</Text>
                <Text style={styles.preview} numberOfLines={1}>
                  {item.last_message ?? "שלחו הודעה ראשונה"}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </CaScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    marginBottom: 10,
    borderRadius: 18,
    backgroundColor: colors.glassDark,
    borderWidth: 1,
    borderColor: colors.glassDarkBorder,
  },
  name: { fontFamily: fonts.bodySemiBold, fontSize: 14.5, fontWeight: "600", color: colors.textPrimary },
  preview: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  empty: { alignItems: "center", paddingTop: 90, paddingHorizontal: 30 },
  emptyIcon: { fontSize: 38, marginBottom: 14 },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: colors.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: "center" },
});
