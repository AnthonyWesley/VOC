import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { colors, fontSize, spacing, fontFamily } from "../tokens";

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.xxl,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.primary,
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});

type Props = {
  title: string;
  children: React.ReactNode;
};

export default function PdfSection({ title, children }: Props) {
  return (
    <View style={styles.wrapper} wrap={false}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}
