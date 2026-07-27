import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAppState } from "../context/AppStateContext";
import { RootStackParamList } from "../navigation/types";

/**
 * Continues wherever the user was trying to go before the auth/onboarding
 * flow interrupted them (see useAuthGate). Falls back to Home when nothing
 * was pending.
 */
export function useResumeAfterAuth() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { pendingDestination, setPendingDestination } = useAppState();

  return function resume() {
    const dest = pendingDestination;
    setPendingDestination(null);

    if (!dest) {
      navigation.navigate("MainTabs", { screen: "Home" });
      return;
    }
    if (dest.kind === "tab") {
      navigation.navigate("MainTabs", { screen: dest.tab });
    } else if (dest.kind === "visualSearch") {
      navigation.navigate("Analyzing", { source: "visual", photoUri: dest.photoUri });
    } else if (dest.kind === "quizSearch") {
      navigation.navigate("Analyzing", { source: "quiz", answers: dest.answers });
    }
  };
}
