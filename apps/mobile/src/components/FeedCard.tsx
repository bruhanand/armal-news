// Single full-screen card in the vertical-snap feed (§01 / §02). Layout
// mirrors the design pack:
//   • top half: image with low-opacity gradient + overlay chrome (category
//     icon top-left + wordmark top-center OR centered wordmark + filter pill)
//   • headline card straddles the seam (translateY -50%)
//   • bottom half: warm-paper panel with italic summary centered + "Tap to
//     read →" affordance bottom-right
import { useMemo } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { CategoryIcon } from "../icons/CategoryIcon";
import { useTheme } from "../theme/ThemeProvider";
import type { FeedItem } from "../api";
import { FilterPill } from "./FilterPill";

type Props = {
  item: FeedItem;
  height: number;
  activeFilter: { slug: string; name: string } | null;
  onPress: () => void;
  onClearFilter: () => void;
  onWordmarkPress: () => void;
};

export function FeedCard({
  item,
  height,
  activeFilter,
  onPress,
  onClearFilter,
  onWordmarkPress,
}: Props) {
  const { tokens } = useTheme();
  const summary = useMemo(() => withCurlyQuotes(item.shortSummary), [item.shortSummary]);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { height, backgroundColor: tokens.color.bg }]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.title}`}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
        <View style={styles.imageScrim} />
        {activeFilter ? (
          <View style={styles.overlayFiltered}>
            <Pressable onPress={onWordmarkPress} accessibilityRole="button">
              <Text style={styles.wordmarkFiltered}>ARMAL NEWS</Text>
            </Pressable>
            <FilterPill
              slug={activeFilter.slug}
              name={activeFilter.name}
              onClear={onClearFilter}
            />
          </View>
        ) : (
          <View style={styles.overlayDefault}>
            <View style={styles.iconSlot}>
              {item.primaryCategorySlug ? (
                <CategoryIcon
                  slug={item.primaryCategorySlug}
                  size={24}
                  color="#FBF7EF"
                />
              ) : null}
            </View>
            <Pressable onPress={onWordmarkPress} accessibilityRole="button">
              <Text style={styles.wordmarkDefault}>ARMAL NEWS</Text>
            </Pressable>
            <View style={styles.iconSlot} />
          </View>
        )}
      </View>
      {/* Headline straddles the image/summary seam. The wrapper is height 0
       * so the absolute card overlaps both halves via translateY -50%. */}
      <View style={styles.headlineAnchor}>
        <View
          style={[
            styles.headline,
            {
              backgroundColor: tokens.color.surface,
              borderColor: tokens.color.border,
            },
          ]}
        >
          <Text
            style={[
              styles.headlineText,
              { color: tokens.color.fg, fontFamily: tokens.font.display },
            ]}
            numberOfLines={3}
          >
            {item.title}
          </Text>
        </View>
      </View>
      <View style={styles.summaryPanel}>
        <Text
          style={[
            styles.summary,
            { color: tokens.color.fg, fontFamily: tokens.font.display },
          ]}
        >
          {summary}
        </Text>
        <Text
          style={[
            styles.tap,
            { color: tokens.color.muted, fontFamily: tokens.font.body },
          ]}
        >
          Tap to read →
        </Text>
      </View>
    </Pressable>
  );
}

// Summaries arrive as plain text; the design wraps them in curly quotes.
function withCurlyQuotes(s: string): string {
  return `“${s}”`;
}

const styles = StyleSheet.create({
  card: { width: "100%", flexDirection: "column" },
  imageWrap: { height: "50%", backgroundColor: "#2B3960", overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  imageScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 130,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  overlayDefault: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconSlot: { width: 24, opacity: 0.55 },
  wordmarkDefault: {
    color: "#FBF7EF",
    fontFamily: "Newsreader, Georgia, serif",
    fontStyle: "italic",
    fontWeight: "500",
    fontSize: 15,
    letterSpacing: 0.9,
    opacity: 0.62,
    textAlign: "center",
  },
  overlayFiltered: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 54,
    paddingHorizontal: 18,
    alignItems: "center",
    gap: 8,
  },
  wordmarkFiltered: {
    color: "#FBF7EF",
    fontFamily: "Newsreader, Georgia, serif",
    fontStyle: "italic",
    fontWeight: "500",
    fontSize: 17,
    letterSpacing: 1.36,
    opacity: 0.9,
  },
  headlineAnchor: { height: 0, zIndex: 5 },
  headline: {
    position: "absolute",
    left: 18,
    right: 18,
    transform: [{ translateY: -64 }],
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 22,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  headlineText: { fontSize: 24, lineHeight: 28, fontWeight: "600" },
  summaryPanel: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  summary: {
    fontSize: 17,
    lineHeight: 25,
    textAlign: "center",
    fontStyle: "italic",
  },
  tap: {
    position: "absolute",
    bottom: 40,
    right: 24,
    fontSize: 13,
    fontWeight: "500",
  },
});

export function useFeedCardHeight(onLayout: (e: LayoutChangeEvent) => void) {
  // re-exported helper so the screen's FlashList can pull the measured page
  // height without each card managing it itself; kept for symmetry with
  // the layout-driven snap math.
  return { onLayout };
}
