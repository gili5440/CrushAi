import React, { useMemo } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, Ellipse, RadialGradient, Rect, Stop, Circle } from "react-native-svg";
import { colors } from "../theme";

const BLOBS = [
  { a: "#6E4A3A", top: -30, left: -40, w: 170, h: 220, rotate: -8 },
  { a: "#3A5A6E", top: 10, right: -50, w: 150, h: 200, rotate: 10 },
  { a: "#6E3A55", top: 250, left: -60, w: 160, h: 210, rotate: 6 },
  { a: "#5A3A6E", top: 230, right: -45, w: 180, h: 230, rotate: -9 },
  { a: "#6E5A3A", bottom: 60, left: -30, w: 150, h: 190, rotate: -5 },
  { a: "#3A6E5E", bottom: 20, right: -30, w: 150, h: 190, rotate: 7 },
] as const;

const REF_W = 375;
const REF_H = 780;

function CaBackground() {
  const { width, height } = useWindowDimensions();
  const scaleX = width / REF_W;
  const scaleY = height / REF_H;

  const stars = useMemo(
    () =>
      Array.from({ length: 24 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 1.2 + Math.random() * 0.8,
        o: 0.15 + Math.random() * 0.55,
      })),
    [width, height]
  );

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="topGlow" cx="50%" cy="0%" r="75%">
          <Stop offset="0%" stopColor={colors.bg2} stopOpacity={1} />
          <Stop offset="62%" stopColor={colors.bg1} stopOpacity={1} />
          <Stop offset="100%" stopColor={colors.bg1} stopOpacity={0} />
        </RadialGradient>
        {BLOBS.map((b, i) => (
          <RadialGradient key={i} id={`blob${i}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={b.a} stopOpacity={0.55} />
            <Stop offset="100%" stopColor={b.a} stopOpacity={0} />
          </RadialGradient>
        ))}
        <RadialGradient id="vignette" cx="50%" cy="38%" r="72%">
          <Stop offset="0%" stopColor="#000000" stopOpacity={0} />
          <Stop offset="35%" stopColor="#000000" stopOpacity={0} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0.55} />
        </RadialGradient>
      </Defs>

      <Rect x={0} y={0} width={width} height={height} fill={colors.bg3} />
      <Rect x={0} y={0} width={width} height={height} fill="url(#topGlow)" />

      {BLOBS.map((b, i) => {
        const w = b.w * scaleX;
        const h = b.h * scaleY;
        const left = ("left" in b ? b.left : REF_W - (b as any).right - b.w) * scaleX;
        const top = ("top" in b ? b.top : REF_H - (b as any).bottom - b.h) * scaleY;
        const cx = left + w / 2;
        const cy = top + h / 2;
        return (
          <Ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx={w / 2}
            ry={h / 2}
            fill={`url(#blob${i})`}
            transform={`rotate(${b.rotate} ${cx} ${cy})`}
          />
        );
      })}

      {stars.map((s, i) => (
        <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#ffffff" opacity={s.o} />
      ))}

      <Rect x={0} y={0} width={width} height={height} fill="url(#vignette)" />
    </Svg>
  );
}

export function CaScreen({
  children,
  scroll = true,
  edges = ["top", "bottom"],
}: {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: ("top" | "bottom" | "left" | "right")[];
}) {
  const Content = scroll ? ScrollView : View;

  return (
    <View style={styles.fill}>
      <CaBackground />
      <SafeAreaView style={styles.fill} edges={edges}>
        <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Content style={styles.fill} contentContainerStyle={scroll ? styles.scrollContent : undefined}>
            {children}
          </Content>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg1 },
  scrollContent: { padding: 22, paddingBottom: 40, flexGrow: 1 },
});
