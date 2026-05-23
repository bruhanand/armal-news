// §05 Onboarding — single screen. "A" mark, wordmark, lede, Continue button,
// "No account needed" footer. AsyncStorage-gated via onboarding-storage.
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import { markOnboarded } from "../lib/onboarding-storage";

export function OnboardingScreen({ onContinue }: { onContinue: () => void }) {
  const { tokens } = useTheme();

  const handleContinue = () => {
    void markOnboarded();
    onContinue();
  };

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: tokens.color.bg }]}
      edges={["top", "bottom"]}
    >
      <View style={styles.mark}>
        <View
          style={[
            styles.iconMark,
            { backgroundColor: tokens.color.surface, borderColor: tokens.color.border },
          ]}
        >
          <Text
            style={[
              styles.iconMarkA,
              { color: tokens.color.accent, fontFamily: tokens.font.display },
            ]}
          >
            A
          </Text>
        </View>
        <Text
          style={[
            styles.wordmark,
            { color: tokens.color.fg, fontFamily: tokens.font.display },
          ]}
        >
          Armal News
        </Text>
        <Text
          style={[
            styles.lede,
            { color: tokens.color.muted, fontFamily: tokens.font.display },
          ]}
        >
          Everything about AI. One story at a time.
        </Text>
      </View>
      <View style={styles.foot}>
        <Pressable
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel="Continue"
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: tokens.color.accent, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Text style={[styles.ctaText, { fontFamily: tokens.font.body }]}>Continue</Text>
        </Pressable>
        <Text
          style={[
            styles.terms,
            { color: tokens.color.muted, fontFamily: tokens.font.body },
          ]}
        >
          No account needed. No ads. No comments.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 32 },
  mark: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  iconMark: {
    width: 100,
    height: 100,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconMarkA: { fontStyle: "italic", fontWeight: "600", fontSize: 64 },
  wordmark: {
    fontStyle: "italic",
    fontWeight: "500",
    fontSize: 40,
    letterSpacing: -0.2,
  },
  lede: {
    fontSize: 19,
    lineHeight: 28,
    textAlign: "center",
    maxWidth: 280,
    marginTop: -8,
  },
  foot: { gap: 14, paddingBottom: 16 },
  cta: {
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: "#FBF7EF", fontWeight: "600", fontSize: 16 },
  terms: { textAlign: "center", fontSize: 12, lineHeight: 17 },
});
