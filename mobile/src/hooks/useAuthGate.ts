import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAppState, PendingDestination } from "../context/AppStateContext";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../navigation/types";

/**
 * Gate an action behind login. If already authenticated (and onboarded), runs
 * immediately. Otherwise stashes what the user was trying to do and pushes the
 * Auth flow; RootNavigator resumes at `destination` once it completes.
 */
export function useAuthGate() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isAuthenticated, hasProfile } = useAuth();
  const { setPendingDestination } = useAppState();

  return function requireAuth(destination: PendingDestination, run: () => void) {
    if (isAuthenticated && hasProfile) {
      run();
      return;
    }
    setPendingDestination(destination);
    if (!isAuthenticated) {
      navigation.navigate("Auth");
    } else {
      navigation.navigate("Onboarding");
    }
  };
}
