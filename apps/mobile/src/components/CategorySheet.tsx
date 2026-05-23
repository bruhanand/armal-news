// §03 Category bottom sheet. ~70% height, dimmed backdrop, drag handle at
// the top, "All stories" as the first row, then the 9 categories with their
// lucide-style icons. Tapping a row fires onSelect + closes.
//
// Drag-to-dismiss is intentionally lightweight: tap the backdrop (or any
// non-row area) to close — the drag handle is a visual affordance from the
// design pack, not a gesture in this slice. A native bottom-sheet library
// would buy us a real drag handle; the cost (gorhom/bottom-sheet + its
// reanimated worklets) is not worth a single sheet in MVP.
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { CategoryIcon, CheckIcon } from "../icons/CategoryIcon";
import { useTheme } from "../theme/ThemeProvider";
import type { Category } from "../api";

type Props = {
  visible: boolean;
  categories: Category[];
  activeSlug: string | null;
  onClose: () => void;
  onSelect: (slug: string | null) => void;
};

export function CategorySheet({
  visible,
  categories,
  activeSlug,
  onClose,
  onSelect,
}: Props) {
  const { tokens } = useTheme();

  function pick(slug: string | null) {
    onSelect(slug);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close categories"
        style={[styles.backdrop, { backgroundColor: tokens.color.backdrop }]}
        onPress={onClose}
      />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: tokens.color.surface,
            borderColor: tokens.color.border,
          },
        ]}
        // Stop the parent backdrop press from closing when the user taps
        // anywhere on the sheet body itself.
        onStartShouldSetResponder={() => true}
      >
        <View style={styles.handleWrap}>
          <View style={[styles.handle, { backgroundColor: tokens.color.muted }]} />
        </View>
        <Text
          style={[
            styles.title,
            { color: tokens.color.fg, fontFamily: tokens.font.display },
          ]}
        >
          Categories
        </Text>
        <View style={styles.rows}>
          <SheetRow
            label="All stories"
            italic
            active={activeSlug === null}
            onPress={() => pick(null)}
          />
          {categories.map((c, idx) => (
            <SheetRow
              key={c.slug}
              label={c.name}
              slug={c.slug}
              showDivider={idx >= 0}
              active={activeSlug === c.slug}
              onPress={() => pick(c.slug)}
            />
          ))}
        </View>
      </View>
    </Modal>
  );
}

function SheetRow({
  label,
  slug,
  italic,
  active,
  showDivider,
  onPress,
}: {
  label: string;
  slug?: string;
  italic?: boolean;
  active: boolean;
  showDivider?: boolean;
  onPress: () => void;
}) {
  const { tokens } = useTheme();
  const color = active ? tokens.color.accent : tokens.color.fg;
  const iconColor = active ? tokens.color.accent : tokens.color.muted;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.row,
        showDivider ? { borderTopColor: tokens.color.border, borderTopWidth: 1 } : null,
        pressed ? { backgroundColor: tokens.color.bg } : null,
      ]}
    >
      <View style={styles.icSlot}>
        {slug ? <CategoryIcon slug={slug} size={22} color={iconColor} /> : null}
      </View>
      <Text
        style={[
          styles.name,
          {
            color,
            fontFamily: tokens.font.body,
            fontStyle: italic ? "italic" : "normal",
            opacity: italic ? 0.85 : 1,
          },
        ]}
      >
        {label}
      </Text>
      <View style={styles.checkSlot}>
        {active ? <CheckIcon size={18} color={tokens.color.accent} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "70%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingBottom: 24,
  },
  handleWrap: { alignItems: "center", paddingTop: 8, paddingBottom: 4 },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 999,
    opacity: 0.45,
  },
  title: {
    textAlign: "center",
    fontWeight: "500",
    fontSize: 18,
    paddingTop: 12,
    paddingBottom: 6,
    letterSpacing: -0.1,
  },
  rows: { paddingTop: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    height: 56,
    paddingHorizontal: 24,
  },
  icSlot: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  name: { flex: 1, fontWeight: "500", fontSize: 16 },
  checkSlot: { width: 20, height: 20, alignItems: "center", justifyContent: "center" },
});
