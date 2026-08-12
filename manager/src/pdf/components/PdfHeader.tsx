import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { colors, fontSize, spacing, fontFamily } from "../tokens";

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: spacing.lg,
    marginBottom: spacing.xxl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  left: {
    flex: 1,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.title,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  right: {
    alignItems: "flex-end",
  },
  docId: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  docLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});

type Props = {
  title: string;
  subtitle?: string;
  documentId?: string;
};

export default function PdfHeader({ title, subtitle, documentId }: Props) {
  return (
    <View style={styles.wrapper} fixed>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {documentId && (
        <View style={styles.right}>
          <Text style={styles.docId}>#{documentId}</Text>
          <Text style={styles.docLabel}>Documento</Text>
        </View>
      )}
    </View>
  );
}
