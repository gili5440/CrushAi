import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme";

const TAB_META: Record<string, { icon: string; label: string }> = {
  Home: { icon: "🏠", label: "בית" },
  Results: { icon: "🔍", label: "תוצאות" },
  Chats: { icon: "💬", label: "צ׳אט" },
  Settings: { icon: "👤", label: "פרופיל" },
};

export function CaTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <BlurView intensity={30} tint="dark" style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      {state.routes.map((route, index) => {
        const meta = TAB_META[route.name] ?? { icon: "•", label: route.name };
        const focused = state.index === index;

        function onPress() {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }

        return (
          <Pressable key={route.key} style={styles.tab} onPress={onPress}>
            <Text style={styles.icon}>{meta.icon}</Text>
            <Text style={[styles.label, focused && styles.labelActive]}>{meta.label}</Text>
          </Pressable>
        );
      })}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.glassDarkBorder,
    backgroundColor: "rgba(16,10,30,0.85)",
  },
  tab: { alignItems: "center", gap: 3 },
  icon: { fontSize: 18 },
  label: { fontSize: 11, color: colors.textSecondary },
  labelActive: { color: colors.accent2 },
});
