// Root component. Three-screen state machine — onboarding gate (§05) →
// feed (§01) → deep-dive (§04). MVP doesn't need a router library: the
// "screen" is just a state variable, the splash is the native Expo splash
// (configured in app.json) plus a tiny JS overlay until the gate resolves.
//
// Per PRD US 15 / the issue: cold-launch always lands on story #1 of "All".
// We don't persist scroll position or last-viewed slug — closing and
// reopening the app drops back to the feed at index 0, not the deep-dive
// the user was reading.
import { useCallback, useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, Text, View } from "react-native";
import { ThemeProvider, useTheme } from "./src/theme/ThemeProvider";
import { hasOnboarded } from "./src/lib/onboarding-storage";
import { OnboardingScreen } from "./src/screens/Onboarding";
import { FeedScreen } from "./src/screens/Feed";
import { DeepDiveScreen } from "./src/screens/DeepDive";

type Route =
  | { kind: "splash" }
  | { kind: "onboarding" }
  | { kind: "feed" }
  | { kind: "deep-dive"; slug: string };

function AppShell() {
  const { tokens, resolved } = useTheme();
  const [route, setRoute] = useState<Route>({ kind: "splash" });

  useEffect(() => {
    void hasOnboarded().then((seen) => {
      setRoute(seen ? { kind: "feed" } : { kind: "onboarding" });
    });
  }, []);

  const openStory = useCallback((slug: string) => {
    setRoute({ kind: "deep-dive", slug });
  }, []);

  const backToFeed = useCallback(() => {
    setRoute({ kind: "feed" });
  }, []);

  const seenOnboarding = useCallback(() => {
    setRoute({ kind: "feed" });
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: tokens.color.bg }]}>
      <StatusBar style={resolved === "dark" ? "light" : "dark"} />
      {route.kind === "splash" ? <JsSplash /> : null}
      {route.kind === "onboarding" ? (
        <OnboardingScreen onContinue={seenOnboarding} />
      ) : null}
      {route.kind === "feed" ? <FeedScreen onOpenStory={openStory} /> : null}
      {route.kind === "deep-dive" ? (
        <DeepDiveScreen slug={route.slug} onBack={backToFeed} />
      ) : null}
    </View>
  );
}

// JS-side splash (§07). Renders while we resolve the onboarding gate from
// AsyncStorage so the user never sees a flash of white between the native
// splash and the first real screen. Matches the design pack: wordmark
// centered with "News · refined" subline, no spinner.
function JsSplash() {
  const { tokens } = useTheme();
  return (
    <View style={[styles.splash, { backgroundColor: tokens.color.bg }]}>
      <Text
        style={[
          styles.splashWord,
          { color: tokens.color.fg, fontFamily: tokens.font.display },
        ]}
      >
        Armal News
      </Text>
      <Text
        style={[
          styles.splashSub,
          { color: tokens.color.muted, fontFamily: tokens.font.mono },
        ]}
      >
        NEWS · REFINED
      </Text>
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1 },
  splash: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  splashWord: {
    fontStyle: "italic",
    fontWeight: "500",
    fontSize: 44,
    letterSpacing: -0.2,
  },
  splashSub: {
    marginTop: 10,
    fontSize: 11,
    letterSpacing: 2,
  },
});
