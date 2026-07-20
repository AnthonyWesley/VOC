import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { colors, fontSize, spacing, fontFamily, borderRadius } from "../tokens";

const styles = StyleSheet.create({
  wrapper: {
    padding: spacing.lg,
    borderRadius,
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  value: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxl,
  },
  row: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  item: {
    flex: 1,
    padding: spacing.md,
    borderRadius,
  },
});

type ColorScheme = "income" | "expense" | "info" | "neutral";

const colorMap: Record<ColorScheme, { bg: string; border: string; text: string }> = {
  income: { bg: "#f0fdf4", border: "#bbf7d0", text: colors.highlight.income },
  expense: { bg: "#fef2f2", border: "#fecaca", text: colors.highlight.expense },
  info: { bg: "#ecfeff", border: "#a5f3fc", text: colors.highlight.info },
  neutral: { bg: colors.surface, border: colors.border, text: colors.text },
};

type Item = {
  label: string;
  value: string;
  color: ColorScheme;
};

type Props = {
  items: Item[];
};

export default function PdfAmountHighlight({ items }: Props) {
  return (
    <View style={styles.row}>
      {items.map((item, i) => {
        const c = colorMap[item.color];
        return (
          <View key={i} style={[styles.item, { backgroundColor: c.bg, borderWidth: 1, borderColor: c.border }]}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={[styles.value, { color: c.text }]}>{item.value}</Text>
          </View>
        );
      })}
    </View>
  );
}
