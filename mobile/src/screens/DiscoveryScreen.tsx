import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import Slider from "@react-native-community/slider";
import { CaBack } from "../components/CaBack";
import { CaButton } from "../components/CaButton";
import { CaFieldLabel } from "../components/CaFieldLabel";
import { CaRangeSlider } from "../components/CaRangeSlider";
import { CaScreen } from "../components/CaScreen";
import { getLocalPref, setLocalPref } from "../lib/localPrefs";
import { RootStackParamList } from "../navigation/types";
import { colors, fonts } from "../theme";

export function DiscoveryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [distance, setDistance] = useState(25);
  const [ageRange, setAgeRange] = useState([18, 45]);

  useEffect(() => {
    getLocalPref("discovery", { distance: 25, ageMin: 18, ageMax: 45 }).then((v) => {
      setDistance(v.distance);
      setAgeRange([v.ageMin, v.ageMax]);
    });
  }, []);

  async function save() {
    await setLocalPref("discovery", { distance, ageMin: ageRange[0], ageMax: ageRange[1] });
    navigation.goBack();
  }

  return (
    <CaScreen>
      <CaBack onPress={() => navigation.goBack()} />
      <Text style={styles.title}>מרחק וטווח גילאים</Text>

      <CaFieldLabel>מרחק מקסימלי</CaFieldLabel>
      <Text style={styles.valueLabel}>{distance} ק"מ</Text>
      <Slider
        minimumValue={1}
        maximumValue={150}
        step={1}
        value={distance}
        onValueChange={setDistance}
        minimumTrackTintColor={colors.accent2}
        maximumTrackTintColor={colors.glassDarkBorder}
        thumbTintColor="#e8e8f4"
        style={{ marginBottom: 16 }}
      />

      <CaFieldLabel>טווח גילאים</CaFieldLabel>
      <CaRangeSlider
        min={18}
        max={65}
        values={ageRange}
        onChange={setAgeRange}
        label={`${ageRange[0]} – ${ageRange[1] === 65 ? "65+" : ageRange[1]}`}
      />

      <CaButton title="שמירה" onPress={save} />
    </CaScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bodySemiBold, fontSize: 19, fontWeight: "600", textAlign: "center", marginBottom: 20, color: colors.textPrimary },
  valueLabel: { textAlign: "center", fontSize: 14, fontWeight: "600", color: colors.textPrimary, marginBottom: 10 },
});
