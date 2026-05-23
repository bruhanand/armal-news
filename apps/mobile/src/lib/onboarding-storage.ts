// AsyncStorage gate for the first-launch onboarding screen.
//
// Per ADR 0004 § J the onboarding is a single-screen splash gate (not a
// flow) — once the user taps Continue the key is set and subsequent cold
// launches go straight to the feed.
import AsyncStorage from "@react-native-async-storage/async-storage";

export const ONBOARDED_STORAGE_KEY = "armal:onboarded";

export async function hasOnboarded(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDED_STORAGE_KEY)) === "1";
  } catch {
    return false;
  }
}

export async function markOnboarded(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDED_STORAGE_KEY, "1");
  } catch {
    // Swallowing — losing the flag means the user sees onboarding again,
    // which is the right fallback for a benign storage failure.
  }
}
