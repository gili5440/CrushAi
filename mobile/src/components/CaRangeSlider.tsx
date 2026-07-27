import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../theme";

const THUMB = 22;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/** Dual- or single-handle slider matching .ca-range-* styles. Pass one value for a single thumb. */
export function CaRangeSlider({
  min,
  max,
  step = 1,
  values,
  onChange,
  label,
}: {
  min: number;
  max: number;
  step?: number;
  values: number[];
  onChange: (values: number[]) => void;
  label?: string;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const valuesRef = useRef(values);
  valuesRef.current = values;

  function onLayout(e: LayoutChangeEvent) {
    setTrackWidth(e.nativeEvent.layout.width - THUMB);
  }

  function posForValue(v: number) {
    if (trackWidth <= 0) return 0;
    return ((v - min) / (max - min)) * trackWidth;
  }

  function valueForPos(px: number) {
    if (trackWidth <= 0) return min;
    const ratio = clamp(px / trackWidth, 0, 1);
    const raw = min + ratio * (max - min);
    return Math.round(raw / step) * step;
  }

  const responders = useMemo(
    () =>
      values.map((_, idx) =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: () => true,
          onPanResponderMove: (_evt, gesture) => {
            const startPx = posForValue(valuesRef.current[idx]);
            const nextVal = clamp(valueForPos(startPx + gesture.dx), min, max);
            const next = [...valuesRef.current];
            if (idx === 0 && next.length === 2) {
              next[0] = Math.min(nextVal, next[1]);
            } else if (idx === 1) {
              next[1] = Math.max(nextVal, next[0]);
            } else {
              next[0] = nextVal;
            }
            onChange(next);
          },
        })
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trackWidth, min, max, step]
  );

  const lowPx = posForValue(values[0]);
  const highPx = values.length === 2 ? posForValue(values[1]) : lowPx;
  const fillLeft = values.length === 2 ? lowPx : 0;
  const fillWidth = values.length === 2 ? highPx - lowPx : lowPx;

  return (
    <View style={{ marginBottom: 20 }}>
      {label ? <Text style={styles.valueLabel}>{label}</Text> : null}
      <View style={styles.wrap} onLayout={onLayout}>
        <View style={styles.track} />
        {trackWidth > 0 && (
          <View style={[styles.fill, { left: fillLeft + THUMB / 2, width: Math.max(fillWidth, 0) }]}>
            <LinearGradient
              colors={[colors.accent1, colors.accent2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        )}
        {values.map((v, idx) => (
          <View
            key={idx}
            {...responders[idx].panHandlers}
            style={[styles.thumb, { left: posForValue(v) }]}
          >
            <LinearGradient colors={["#e8e8f4", "#8f8fa8"]} style={StyleSheet.absoluteFill} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  valueLabel: { textAlign: "center", fontSize: 14, fontWeight: "600", color: colors.textPrimary, marginBottom: 14 },
  wrap: { height: 36, justifyContent: "center" },
  track: {
    position: "absolute",
    left: THUMB / 2,
    right: THUMB / 2,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.glassDarkBorder,
  },
  fill: { position: "absolute", height: 4, borderRadius: 2, overflow: "hidden" },
  thumb: {
    position: "absolute",
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 2,
    borderColor: colors.bg1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
