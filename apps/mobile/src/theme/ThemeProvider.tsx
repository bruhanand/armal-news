// Theme provider for the mobile app.
//
// Three-state cycle (system → light → dark → system) backed by AsyncStorage
// under `armal:theme`. The "system" choice resyncs live to OS preference via
// react-native's Appearance listener so a user who flips iOS dark mode while
// the app is open sees the switch immediately. Resolved palette comes from
// @armal/shared/design/tokens — the same TS object the web's tokens.css
// mirrors, so colors are bit-for-bit identical across surfaces.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { tokens } from "@armal/shared/design/tokens";
import {
  isThemeChoice,
  nextThemeChoice,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemeChoice,
} from "./choice";

export type { ResolvedTheme, ThemeChoice } from "./choice";

// The shared `ThemeTokens` alias is `typeof lightTokens`, which TS treats as
// a literal-types snapshot of the light palette — the dark palette has
// different string literals and so isn't assignable to it. The mobile app
// only needs the structural shape, so derive it from `tokens[resolved]`
// (a union of both palettes) and skip the shared alias.
type Tokens = (typeof tokens)[ResolvedTheme];

type ThemeContextValue = {
  choice: ThemeChoice;
  resolved: ResolvedTheme;
  tokens: Tokens;
  cycle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function currentSystemScheme(): ResolvedTheme {
  return Appearance.getColorScheme() === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<ThemeChoice>("system");
  const [systemScheme, setSystemScheme] = useState<ResolvedTheme>(
    currentSystemScheme(),
  );

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (cancelled) return;
        if (isThemeChoice(stored)) setChoice(stored);
      })
      .catch(() => {
        // AsyncStorage failures are benign — fall back to "system".
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === "dark" ? "dark" : "light");
    });
    return () => sub.remove();
  }, []);

  const cycle = useCallback(() => {
    setChoice((prev) => {
      const next = nextThemeChoice(prev);
      AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const resolved = resolveTheme(choice, systemScheme);

  const value = useMemo<ThemeContextValue>(
    () => ({
      choice,
      resolved,
      tokens: tokens[resolved],
      cycle,
    }),
    [choice, resolved, cycle],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return ctx;
}
