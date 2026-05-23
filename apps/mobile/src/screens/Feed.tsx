// §01–§02 Feed home. Full-screen vertical-paged FlashList — one Story per
// screen, snap on release. Cursor-paginated via /api/feed; the wordmark
// scrolls back to index 0 of the current filter; tapping the category icon
// or the active filter pill opens the category sheet.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { SafeAreaView } from "react-native-safe-area-context";
import { CATEGORIES } from "@armal/shared/constants/categories";
import { apiClient } from "../api";
import type { Category, FeedItem } from "../api";
import { FeedCard } from "../components/FeedCard";
import { CategorySheet } from "../components/CategorySheet";
import { CategoryIcon, SunIcon } from "../icons/CategoryIcon";
import { useTheme } from "../theme/ThemeProvider";

type Props = {
  onOpenStory: (slug: string) => void;
};

export function FeedScreen({ onOpenStory }: Props) {
  const { tokens, cycle: cycleTheme } = useTheme();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cardHeight, setCardHeight] = useState(0);
  const listRef = useRef<FlashList<FeedItem> | null>(null);

  const loadFirstPage = useCallback(async (slug: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const page = await apiClient.getFeed({ category: slug ?? undefined });
      setItems(page.items);
      setNextCursor(page.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Feed failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  // First-launch load + category-change reload.
  useEffect(() => {
    void loadFirstPage(activeSlug);
  }, [activeSlug, loadFirstPage]);

  // Categories list is fetched once for the sheet — falls back to the
  // bundled seed list (CATEGORIES) if the network call fails, so the sheet
  // never renders empty.
  useEffect(() => {
    apiClient
      .getCategories()
      .then((cats) => setCategories(cats))
      .catch(() => {
        setCategories(
          CATEGORIES.map((c) => ({
            slug: c.slug,
            name: c.name,
            sortOrder: c.sortOrder,
          })),
        );
      });
  }, []);

  const onEndReached = useCallback(async () => {
    if (!nextCursor || loading) return;
    try {
      const page = await apiClient.getFeed({
        category: activeSlug ?? undefined,
        cursor: nextCursor,
      });
      setItems((prev) => [...prev, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch {
      // Quietly swallow pagination failures — the user can swipe back to
      // trigger another fetch attempt.
    }
  }, [nextCursor, loading, activeSlug]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const page = await apiClient.getFeed({
        category: activeSlug ?? undefined,
      });
      setItems(page.items);
      setNextCursor(page.nextCursor);
    } catch {
      // see onEndReached comment.
    } finally {
      setRefreshing(false);
    }
  }, [activeSlug]);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const onLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h && h !== cardHeight) setCardHeight(h);
  };

  const activeFilter = activeSlug
    ? {
        slug: activeSlug,
        name:
          categories.find((c) => c.slug === activeSlug)?.name ??
          CATEGORIES.find((c) => c.slug === activeSlug)?.name ??
          activeSlug,
      }
    : null;

  return (
    <View style={[styles.root, { backgroundColor: tokens.color.bg }]}>
      <View style={styles.listWrap} onLayout={onLayout}>
        {cardHeight > 0 ? (
          <FlashList
            ref={listRef}
            data={items}
            keyExtractor={(item) => item.id}
            estimatedItemSize={cardHeight}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={cardHeight}
            snapToAlignment="start"
            onEndReached={onEndReached}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={tokens.color.muted}
              />
            }
            renderItem={({ item }) => (
              <FeedCard
                item={item}
                height={cardHeight}
                activeFilter={activeFilter}
                onPress={() => onOpenStory(item.slug)}
                onClearFilter={() => setActiveSlug(null)}
                onWordmarkPress={scrollToTop}
              />
            )}
          />
        ) : null}
      </View>
      {/* Tap-targets layered above the FlashList for the category icon and
       * wordmark — the FeedCard's own overlay is decorative so the parent
       * can keep the hit areas reliable even when the list is scrolling. */}
      <SafeAreaView edges={["top"]} style={styles.chrome} pointerEvents="box-none">
        <View style={styles.chromeRow} pointerEvents="box-none">
          {activeFilter ? (
            <View style={{ width: 28, height: 28 }} />
          ) : (
            <Pressable
              hitSlop={16}
              accessibilityRole="button"
              accessibilityLabel="Open categories"
              onPress={() => setSheetOpen(true)}
              style={styles.chromeBtn}
            >
              <CategoryIcon
                slug={items[0]?.primaryCategorySlug ?? null}
                size={24}
                color="#FBF7EF"
              />
            </Pressable>
          )}
          <View style={{ flex: 1 }} />
          <Pressable
            hitSlop={16}
            accessibilityRole="button"
            accessibilityLabel="Cycle theme"
            onPress={cycleTheme}
            // Theme toggle placement per the issue's "judgment" note —
            // small icon next to the category icon, low opacity. Cycles
            // system → light → dark → system.
            style={[styles.chromeBtn, { opacity: 0.55 }]}
          >
            <SunIcon size={20} color="#FBF7EF" />
          </Pressable>
        </View>
      </SafeAreaView>
      {/* Big invisible hit area for the wordmark / filter pill at the top
       * of the active card — opens the sheet (or, when filtered, the pill
       * inside FeedCard owns the dismiss). */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open categories"
        onPress={() => setSheetOpen(true)}
        style={styles.wordmarkHit}
        pointerEvents="box-only"
      />
      {loading && items.length === 0 ? (
        <View style={styles.center} pointerEvents="none">
          <ActivityIndicator color={tokens.color.muted} />
        </View>
      ) : null}
      {error && items.length === 0 ? (
        <View style={styles.center} pointerEvents="none">
          <Text style={{ color: tokens.color.muted }}>{error}</Text>
        </View>
      ) : null}
      <CategorySheet
        visible={sheetOpen}
        categories={categories}
        activeSlug={activeSlug}
        onClose={() => setSheetOpen(false)}
        onSelect={(slug) => setActiveSlug(slug)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listWrap: { flex: 1 },
  chrome: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 50 },
  chromeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 0,
    gap: 8,
  },
  chromeBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  wordmarkHit: {
    position: "absolute",
    top: 50,
    left: "30%",
    right: "30%",
    height: 40,
    zIndex: 40,
  },
  center: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
