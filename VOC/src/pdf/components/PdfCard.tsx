import { View, StyleSheet } from "@react-pdf/renderer";
import { colors, spacing, borderRadius } from "../tokens";

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
});

type Props = {
  children: React.ReactNode;
};

export default function PdfCard({ children }: Props) {
  return <View style={styles.card}>{children}</View>;
}
