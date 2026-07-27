import React from "react";
import { StyleSheet, Text } from "react-native";
import { CaButton } from "../components/CaButton";
import { CaIconCircle } from "../components/CaIconCircle";
import { CaScreen } from "../components/CaScreen";
import { colors, fonts } from "../theme";

export function NotifScreen({ onDone }: { onDone: () => void }) {
  return (
    <CaScreen>
      <CaIconCircle icon="🔔" />
      <Text style={styles.title}>נשלח לך ידיעה כשיש התאמה</Text>
      <Text style={styles.sub}>
        כדי שלא תפספסי כשמישהו מתאים לסטייל שלך, כדאי להפעיל התראות. אפשר לשנות את זה בכל שלב בהגדרות.
      </Text>
      <CaButton title="הפעלת התראות" onPress={onDone} />
      <CaButton title="לא כרגע" variant="secondary" onPress={onDone} />
    </CaScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bodySemiBold, fontSize: 19, fontWeight: "600", textAlign: "center", marginBottom: 8, color: colors.textPrimary },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: "center", marginBottom: 28, lineHeight: 20 },
});
