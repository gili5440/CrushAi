import AsyncStorage from "@react-native-async-storage/async-storage";

// Discovery-radius/orientation prefs have no backend column yet (profiles only
// models the user's own attributes) — stored locally until a preferences table exists.
export async function getLocalPref<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(`ca_pref_${key}`);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setLocalPref<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(`ca_pref_${key}`, JSON.stringify(value));
}
