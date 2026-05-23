// §04 Deep-dive article.
//
// Layout:
//   • Hero image (38%) with glassy back button overlay
//   • Article: eyebrow (mono caps) + Newsreader 600 headline + italic
//     summary + body (react-native-markdown-display, JetBrains Mono code
//     blocks, 2px accent left-rule for blockquotes) + tag chips + accent
//     "View source ↗" pill PLUS mono `source-host` line (ADR 0004 § L).
//
// Native share: invokes the OS share sheet with the canonical
// `https://…/story/[slug]` URL so the recipient lands on the SSR'd page
// (slice 0006 OG card).
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Markdown from "react-native-markdown-display";
import { apiClient, API_BASE_URL } from "../api";
import type { StoryDetail } from "../api";
import { parseSourceHost } from "../lib/source-host";
import { useTheme } from "../theme/ThemeProvider";
import {
  ArrowUpRightIcon,
  ChevronLeftIcon,
  ShareIcon,
} from "../icons/CategoryIcon";

type Props = {
  slug: string;
  onBack: () => void;
};

export function DeepDiveScreen({ slug, onBack }: Props) {
  const { tokens } = useTheme();
  const [story, setStory] = useState<StoryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .getStoryBySlug(slug)
      .then((s) => {
        if (!cancelled) setStory(s);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Story failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: tokens.color.bg }]}>
        <Text style={{ color: tokens.color.muted, textAlign: "center", marginTop: 32 }}>
          {error}
        </Text>
        <BackButton onPress={onBack} />
      </SafeAreaView>
    );
  }
  if (!story) {
    return (
      <View style={[styles.root, { backgroundColor: tokens.color.bg, justifyContent: "center" }]}>
        <ActivityIndicator color={tokens.color.muted} />
        <BackButton onPress={onBack} />
      </View>
    );
  }

  const sourceHost = parseSourceHost(story.sourceLink);
  // Canonical share URL points at the SSR page on the web so recipients
  // get the OG preview from slice 0006. Mobile-only links would break the
  // share-stable contract.
  const shareUrl = `${API_BASE_URL.replace(/\/$/, "")}/story/${story.slug}`;

  // Note: the issue mentions `expo-sharing`, but expo-sharing's shareAsync
  // accepts a local file URI only — it can't share a URL string. The
  // canonical OS-native share sheet for arbitrary URLs is `react-native`'s
  // built-in Share API, which is what produces the iOS / Android system
  // sheet and is the right primitive for this contract.
  const onShare = () => {
    void Share.share({ url: shareUrl, message: shareUrl, title: story.title });
  };

  const onOpenSource = () => {
    void Linking.openURL(story.sourceLink);
  };

  const eyebrow = (story.tags[0] ?? "").trim();
  const markdownStyles = buildMarkdownStyles(tokens);

  return (
    <View style={[styles.root, { backgroundColor: tokens.color.bg }]}>
      <View style={styles.heroWrap}>
        <Image source={{ uri: story.imageUrl }} style={styles.hero} resizeMode="cover" />
        <View style={styles.heroScrim} />
        <SafeAreaView edges={["top"]} style={styles.heroChrome}>
          <BackButton onPress={onBack} />
          <View style={{ flex: 1 }} />
          <Pressable
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Share"
            onPress={onShare}
            style={styles.glassBtn}
          >
            <ShareIcon size={18} color="#FBF7EF" />
          </Pressable>
        </SafeAreaView>
      </View>
      <ScrollView
        style={styles.article}
        contentContainerStyle={styles.articleContent}
        showsVerticalScrollIndicator={false}
      >
        {eyebrow ? (
          <Text style={[styles.eyebrow, { color: tokens.color.muted, fontFamily: tokens.font.mono }]}>
            {eyebrow.toUpperCase()}
          </Text>
        ) : null}
        <Text
          style={[
            styles.title,
            { color: tokens.color.fg, fontFamily: tokens.font.display },
          ]}
        >
          {story.title}
        </Text>
        <Text
          style={[
            styles.summary,
            { color: tokens.color.muted, fontFamily: tokens.font.display },
          ]}
        >
          {`“${story.shortSummary}”`}
        </Text>
        <Markdown style={markdownStyles}>{story.bodyMarkdown}</Markdown>
        {story.tags.length > 0 ? (
          <View style={styles.tags}>
            {story.tags.map((t) => (
              <Text
                key={t}
                style={[
                  styles.chip,
                  {
                    color: tokens.color.muted,
                    backgroundColor: tokens.color.surface,
                    borderColor: tokens.color.border,
                    fontFamily: tokens.font.mono,
                  },
                ]}
              >
                {t.startsWith("#") ? t : `#${t}`}
              </Text>
            ))}
          </View>
        ) : null}
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="View source"
          onPress={onOpenSource}
          style={[styles.sourcePill, { backgroundColor: tokens.color.accent }]}
        >
          <Text style={[styles.sourcePillText, { fontFamily: tokens.font.body }]}>
            View source
          </Text>
          <ArrowUpRightIcon size={14} color="#FBF7EF" />
        </Pressable>
        {/* Mobile-only host line — ADR 0004 § L. Desktop deep-dive shows
         * the pill alone; mobile adds this trust preview because mobile
         * browsers don't reveal the destination URL on hover. */}
        {sourceHost ? (
          <Text
            style={[
              styles.sourceHost,
              { color: tokens.color.muted, fontFamily: tokens.font.mono },
            ]}
          >
            {sourceHost}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={onPress}
      style={styles.glassBtn}
    >
      <ChevronLeftIcon size={18} color="#FBF7EF" />
    </Pressable>
  );
}

// react-native-markdown-display style overrides — JetBrains Mono for code
// blocks, accent 2px left-rule for blockquotes (= the "pull quote" pattern
// in §04).
type StyleTokens = ReturnType<typeof useTheme>["tokens"];
function buildMarkdownStyles(tokens: StyleTokens) {
  return {
    body: {
      color: tokens.color.fg,
      fontFamily: tokens.font.body,
      fontSize: 15,
      lineHeight: 25,
    },
    paragraph: { marginBottom: 14 },
    heading2: {
      color: tokens.color.fg,
      fontFamily: tokens.font.display,
      fontWeight: "600" as const,
      fontSize: 20,
      marginTop: 18,
      marginBottom: 8,
    },
    heading3: {
      color: tokens.color.fg,
      fontFamily: tokens.font.display,
      fontWeight: "600" as const,
      fontSize: 17,
      marginTop: 14,
      marginBottom: 6,
    },
    strong: { fontWeight: "600" as const, color: tokens.color.fg },
    em: { fontStyle: "italic" as const },
    link: { color: tokens.color.accent },
    blockquote: {
      borderLeftWidth: 2,
      borderLeftColor: tokens.color.accent,
      paddingLeft: 14,
      paddingVertical: 4,
      marginVertical: 18,
      fontFamily: tokens.font.display,
      fontStyle: "italic" as const,
      fontSize: 17,
      lineHeight: 24,
      backgroundColor: "transparent",
    },
    code_inline: {
      fontFamily: tokens.font.mono,
      fontSize: 13,
      color: tokens.color.accent,
      backgroundColor: tokens.color.surface,
      paddingHorizontal: 4,
      borderRadius: 4,
    },
    code_block: {
      fontFamily: tokens.font.mono,
      fontSize: 13,
      color: tokens.color.fg,
      backgroundColor: tokens.color.surface,
      borderColor: tokens.color.border,
      borderWidth: 1,
      borderRadius: 6,
      padding: 12,
    },
    fence: {
      fontFamily: tokens.font.mono,
      fontSize: 13,
      color: tokens.color.fg,
      backgroundColor: tokens.color.surface,
      borderColor: tokens.color.border,
      borderWidth: 1,
      borderRadius: 6,
      padding: 12,
    },
    bullet_list: { marginVertical: 8 },
    ordered_list: { marginVertical: 8 },
  };
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  heroWrap: { height: "38%", backgroundColor: "#2B3960", overflow: "hidden" },
  hero: { width: "100%", height: "100%" },
  heroScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 130,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  heroChrome: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  glassBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(20,16,8,0.42)",
    alignItems: "center",
    justifyContent: "center",
  },
  article: { flex: 1 },
  articleContent: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 56 },
  eyebrow: { fontSize: 11, letterSpacing: 1.5, marginBottom: 10 },
  title: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "600",
    letterSpacing: -0.1,
    marginBottom: 14,
  },
  summary: {
    fontSize: 17,
    lineHeight: 25,
    fontStyle: "italic",
    marginBottom: 20,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 22 },
  chip: {
    fontSize: 11,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  sourcePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  sourcePillText: { color: "#FBF7EF", fontWeight: "600", fontSize: 13 },
  sourceHost: { display: "flex", marginTop: 10, fontSize: 11 },
});
