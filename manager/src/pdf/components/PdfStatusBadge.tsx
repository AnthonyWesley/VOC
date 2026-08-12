import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { colors, fontSize, spacing, fontFamily } from "../tokens";

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 3,
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    letterSpacing: 0.5,
  },
});

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: "#f0fdf4", text: colors.success },
  warning: { bg: "#fffbeb", text: colors.warning },
  error: { bg: "#fef2f2", text: colors.error },
  info: { bg: "#ecfeff", text: colors.accent },
  neutral: { bg: colors.surface, text: colors.textSecondary },
};

type Props = {
  label: string;
  variant?: BadgeVariant;
};

export default function PdfStatusBadge({ label, variant = "info" }: Props) {
  const v = variantMap[variant];
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }]}>
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
}
