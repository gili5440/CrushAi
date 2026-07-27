import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { CaBack } from "../components/CaBack";
import { CaScreen } from "../components/CaScreen";
import { CaSectionHead } from "../components/CaSectionHead";
import { RootStackParamList } from "../navigation/types";
import { colors } from "../theme";

const ITEMS = [
  { icon: "💜", text: "יש לך התאמה חדשה עם דנה", time: "לפני 5 דקות" },
  { icon: "👀", text: "מישהו חיפש בסטייל שלך וגילה אותך", time: "לפני שעה" },
  { icon: "💬", text: "תום שלח לך הודעה חדשה", time: "אתמול" },
  { icon: "✓", text: "הפרופיל שלך אומת בהצלחה", time: "לפני 3 ימים" },
];

export function InboxScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <CaScreen>
      <CaBack onPress={() => navigation.goBack()} />
      <CaSectionHead style={{ marginTop: 0 }}>התראות</CaSectionHead>
      {ITEMS.map((item, i) => (
        <View key={i} style={[styles.row, i === ITEMS.length - 1 && styles.rowLast]}>
          <View style={styles.icon}>
            <Text style={{ fontSize: 16 }}>{item.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.text}>{item.text}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
        </View>
      ))}
    </CaScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassDarkBorder,
  },
  rowLast: { borderBottomWidth: 0 },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.glassDark,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontSize: 13, color: colors.textPrimary },
  time: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
