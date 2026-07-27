import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "../api/client";
import { CaAvatar } from "../components/CaAvatar";
import { CaBack } from "../components/CaBack";
import { CaInput } from "../components/CaInput";
import { CaScreen } from "../components/CaScreen";
import { RootStackParamList } from "../navigation/types";
import { colors, fonts, radii } from "../theme";

type Message = { id: string; sender_id: string; content: string; created_at: string };

export function ChatroomScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<NativeStackScreenProps<RootStackParamList, "Chatroom">["route"]>();
  const { matchId, name, avatarSeed } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    api.getMe().then((r) => setMyUserId(r.userId));
    api.getMessages(matchId).then((r) => setMessages(r.messages));
  }, [matchId]);

  async function send() {
    const content = draft.trim();
    if (!content) return;
    setSending(true);
    setDraft("");
    try {
      const message = await api.sendMessage(matchId, content);
      setMessages((prev) => [...prev, message]);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } finally {
      setSending(false);
    }
  }

  return (
    <CaScreen scroll={false}>
      <View style={styles.header}>
        <CaBack label="← חזרה לצ׳אטים" onPress={() => navigation.goBack()} />
        <View style={styles.headerRow}>
          <CaAvatar seed={avatarSeed} size={40} />
          <Text style={styles.name}>{name}</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messages}
        renderItem={({ item }) => {
          const mine = item.sender_id === myUserId;
          return (
            <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={mine ? styles.bubbleTextMine : styles.bubbleTextTheirs}>{item.content}</Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.inputRow}>
        <CaInput
          style={{ flex: 1, marginBottom: 0 }}
          placeholder="כתבי הודעה..."
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={send}
        />
        <Pressable style={styles.sendBtn} onPress={send} disabled={sending}>
          <Text style={styles.sendIcon}>↑</Text>
        </Pressable>
      </View>
    </CaScreen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 22, paddingTop: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  name: { fontFamily: fonts.bodySemiBold, fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  messages: { paddingHorizontal: 22, paddingVertical: 10, gap: 4 },
  bubbleRow: { flexDirection: "row", marginBottom: 8 },
  rowMine: { justifyContent: "flex-end" },
  rowTheirs: { justifyContent: "flex-start" },
  bubble: { maxWidth: "75%", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16 },
  bubbleTheirs: { backgroundColor: colors.glassDark, borderWidth: 1, borderColor: colors.glassDarkBorder },
  bubbleMine: { backgroundColor: colors.accent1 },
  bubbleTextTheirs: { color: colors.textPrimary, fontSize: 13.5, lineHeight: 19 },
  bubbleTextMine: { color: colors.btnPrimaryText, fontSize: 13.5, lineHeight: 19 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 22, paddingBottom: 12, paddingTop: 4 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent2,
    alignItems: "center",
    justifyContent: "center",
  },
  sendIcon: { color: colors.btnPrimaryText, fontSize: 18, fontWeight: "700" },
});
