import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { Alert } from "react-native";
import { CaButton } from "../components/CaButton";
import { CaInfoCard } from "../components/CaInfoCard";
import { CaScreen } from "../components/CaScreen";
import { CaSectionHead } from "../components/CaSectionHead";
import { RootStackParamList } from "../navigation/types";

export function SafetyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <CaScreen>
      <CaSectionHead style={{ marginTop: 0 }}>בטיחות ותמיכה</CaSectionHead>
      <CaInfoCard title="לפני שנפגשים">ספרו לחבר/ה על התוכניות שלכם, קבעו במקום ציבורי, ואל תשתפו פרטים פיננסיים.</CaInfoCard>
      <CaInfoCard title="חסימה ודיווח">ניתן לחסום ולדווח על כל משתמש מתוך הפרופיל או הצ'אט שלו, בכל שלב.</CaInfoCard>
      <CaInfoCard title="יצירת קשר עם התמיכה">הצוות שלנו זמין 24/7 לכל שאלה או תקרית.</CaInfoCard>
      <CaButton title="יש לי חשש — דיווח מיידי" variant="danger" onPress={() => Alert.alert("דיווח נשלח לצוות הבטיחות")} />
      <CaButton title="חזרה" variant="secondary" onPress={() => navigation.goBack()} />
    </CaScreen>
  );
}
