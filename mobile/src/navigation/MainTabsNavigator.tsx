import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { CommonActions } from "@react-navigation/native";
import React from "react";
import { CaTabBar } from "../components/CaTabBar";
import { useAppState } from "../context/AppStateContext";
import { useAuth } from "../context/AuthContext";
import { ChatsScreen } from "../screens/ChatsScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { ResultsScreen } from "../screens/ResultsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { MainTabParamList } from "./types";

const GATED_TABS: (keyof MainTabParamList)[] = ["Results", "Chats", "Settings"];

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabsNavigator() {
  const { isAuthenticated, hasProfile } = useAuth();
  const { setPendingDestination } = useAppState();

  return (
    <Tab.Navigator
      tabBar={(props) => <CaTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      screenListeners={({ navigation, route }) => ({
        tabPress: (e) => {
          const needsAuth = GATED_TABS.includes(route.name as keyof MainTabParamList);
          if (needsAuth && !(isAuthenticated && hasProfile)) {
            e.preventDefault();
            setPendingDestination({ kind: "tab", tab: route.name as "Results" | "Chats" | "Settings" });
            const root = navigation.getParent();
            root?.dispatch(
              CommonActions.navigate({ name: !isAuthenticated ? "Auth" : "Onboarding" })
            );
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Results" component={ResultsScreen} />
      <Tab.Screen name="Chats" component={ChatsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
