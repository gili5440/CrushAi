import { useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator, NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { AnalyzingScreen } from "../screens/AnalyzingScreen";
import { AuthScreen } from "../screens/AuthScreen";
import { BoostScreen } from "../screens/BoostScreen";
import { ChatroomScreen } from "../screens/ChatroomScreen";
import { DeleteAccountScreen } from "../screens/DeleteAccountScreen";
import { DiscoveryScreen } from "../screens/DiscoveryScreen";
import { EditProfileScreen } from "../screens/EditProfileScreen";
import { ForgotPasswordScreen } from "../screens/ForgotPasswordScreen";
import { InboxScreen } from "../screens/InboxScreen";
import { InterestsScreen } from "../screens/InterestsScreen";
import { InviteScreen } from "../screens/InviteScreen";
import { MatchScreen } from "../screens/MatchScreen";
import { NotifScreen } from "../screens/NotifScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { OrientationScreen } from "../screens/OrientationScreen";
import { OtpScreen } from "../screens/OtpScreen";
import { PremiumScreen } from "../screens/PremiumScreen";
import { ProfileDetailScreen } from "../screens/ProfileDetailScreen";
import { QuizScreen } from "../screens/QuizScreen";
import { SafetyScreen } from "../screens/SafetyScreen";
import { ShowMeScreen } from "../screens/ShowMeScreen";
import { SplashScreen } from "../screens/SplashScreen";
import { VerifyScreen } from "../screens/VerifyScreen";
import { useResumeAfterAuth } from "../hooks/useResumeAfterAuth";
import { MainTabsNavigator } from "./MainTabsNavigator";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

function OnboardingRoute() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return <OnboardingScreen onDone={() => navigation.navigate("Notif")} />;
}

function NotifRoute() {
  const resume = useResumeAfterAuth();
  return <NotifScreen onDone={resume} />;
}

export function RootNavigator() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {showSplash ? (
        <Stack.Screen name="Splash" component={SplashScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Forgot" component={ForgotPasswordScreen} />
          <Stack.Screen name="Otp" component={OtpScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingRoute} />
          <Stack.Screen name="Notif" component={NotifRoute} />
          <Stack.Screen name="Quiz" component={QuizScreen} />
          <Stack.Screen name="Analyzing" component={AnalyzingScreen} />
          <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} />
          <Stack.Screen name="Match" component={MatchScreen} />
          <Stack.Screen name="Chatroom" component={ChatroomScreen} />
          <Stack.Screen name="Premium" component={PremiumScreen} />
          <Stack.Screen name="Boost" component={BoostScreen} />
          <Stack.Screen name="Inbox" component={InboxScreen} />
          <Stack.Screen name="Discovery" component={DiscoveryScreen} />
          <Stack.Screen name="ShowMe" component={ShowMeScreen} />
          <Stack.Screen name="Interests" component={InterestsScreen} />
          <Stack.Screen name="Orientation" component={OrientationScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Verify" component={VerifyScreen} />
          <Stack.Screen name="Safety" component={SafetyScreen} />
          <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
          <Stack.Screen name="Invite" component={InviteScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
