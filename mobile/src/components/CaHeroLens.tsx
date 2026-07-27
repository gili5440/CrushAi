import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

const SIZE = 230;
const LENS = 156;
const LENS_OFFSET = (SIZE - LENS) / 2;

const QUADRANTS = [
  { colors: ["#6E4A3A", "#2A1D16"], top: -6, left: -6, radius: { br: 60 } },
  { colors: ["#3A5A6E", "#182530"], top: -6, right: -6, radius: { bl: 60 } },
  { colors: ["#6E3A55", "#301823"], bottom: -6, left: -6, radius: { tr: 60 } },
  { colors: ["#5A3A6E", "#241A34"], bottom: -6, right: -6, radius: { tl: 60 } },
] as const;

export function CaHeroLens() {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 24000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.ring, { transform: [{ rotate }] }]} />

      <View style={styles.lensWrap}>
        <LinearGradient
          colors={["#e8e8f4", "#8f8fa8", "#cfcfe0", "#6e6e86"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.lensRim}
        >
          <View style={styles.lensGlass}>
            {QUADRANTS.map((q, i) => (
              <LinearGradient
                key={i}
                colors={q.colors as unknown as [string, string]}
                style={[
                  styles.quadrant,
                  "top" in q ? { top: q.top } : { bottom: q.bottom },
                  "left" in q ? { left: q.left } : { right: q.right },
                  q.radius.br ? { borderBottomRightRadius: q.radius.br } : null,
                  q.radius.bl ? { borderBottomLeftRadius: q.radius.bl } : null,
                  q.radius.tr ? { borderTopRightRadius: q.radius.tr } : null,
                  q.radius.tl ? { borderTopLeftRadius: q.radius.tl } : null,
                ]}
              />
            ))}
            <View style={styles.glassHighlight} />
          </View>
        </LinearGradient>

        <LinearGradient
          colors={["#5c5c70", "#e8e8f4", "#cfcfe0", "#6e6e86"]}
          locations={[0, 0.35, 0.55, 1]}
          style={styles.handle}
        >
          <View style={styles.handleCap} />
        </LinearGradient>
      </View>

      <Text style={styles.sparkle}>✦</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignSelf: "center", marginBottom: 28, alignItems: "center", justifyContent: "center" },
  ring: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1.5,
    borderColor: colors.purple400,
    borderStyle: "dashed",
    opacity: 0.7,
  },
  lensWrap: { position: "absolute", top: LENS_OFFSET, left: LENS_OFFSET, width: LENS, height: LENS },
  lensRim: {
    width: LENS,
    height: LENS,
    borderRadius: LENS / 2,
    padding: 5,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  lensGlass: {
    flex: 1,
    borderRadius: (LENS - 10) / 2,
    overflow: "hidden",
    backgroundColor: colors.bg2,
  },
  quadrant: { position: "absolute", width: "58%", height: "58%" },
  glassHighlight: {
    position: "absolute",
    top: "10%",
    left: "18%",
    width: "38%",
    height: "30%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  handle: {
    position: "absolute",
    width: 20,
    height: 118,
    borderRadius: 10,
    bottom: -92,
    right: -30,
    transform: [{ rotate: "45deg" }],
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  handleCap: {
    position: "absolute",
    top: 0,
    left: "50%",
    marginLeft: -13,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#c9c9dc",
  },
  sparkle: {
    position: "absolute",
    top: 8,
    right: 30,
    fontSize: 18,
    color: colors.gold,
  },
});
