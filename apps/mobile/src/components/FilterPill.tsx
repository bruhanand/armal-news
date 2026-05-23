// Filter pill rendered in the feed overlay when a category is active.
// Matches §02 — glassy warm-paper background, category icon at low opacity,
// name, then a circular ✕ that the parent wires up to clear the filter.
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CategoryIcon, XIcon } from "../icons/CategoryIcon";

export function FilterPill({
  slug,
  name,
  onClear,
}: {
  slug: string;
  name: string;
  onClear: () => void;
}) {
  return (
    <View style={styles.pill}>
      <View style={styles.iconWrap}>
        <CategoryIcon slug={slug} size={13} color="#2F2A1F" />
      </View>
      <Text style={styles.name}>{name}</Text>
      <Pressable
        onPress={onClear}
        accessibilityRole="button"
        accessibilityLabel="Clear filter"
        // 44×44 hit target per the design pack "Pill dismiss · 44×44 hit target"
        // meta on §02 — the visible × dot is 20px, hitSlop expands it.
        hitSlop={12}
        style={styles.x}
      >
        <XIcon size={10} color="#2F2A1F" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    paddingLeft: 11,
    paddingRight: 5,
    backgroundColor: "rgba(252,246,235,0.94)",
    borderRadius: 999,
  },
  iconWrap: { opacity: 0.65 },
  name: { color: "#2F2A1F", fontWeight: "500", fontSize: 12 },
  x: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
});
