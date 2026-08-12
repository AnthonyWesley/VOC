import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { colors, fontSize, spacing, fontFamily } from "../tokens";

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  label: {
    width: 120,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  value: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  highlight: {
    fontFamily: fontFamily.bold,
  },
});

type Props = {
  label: string;
  value: string;
  highlight?: boolean;
};

export default function PdfInfoRow({ label, value, highlight }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, ...(highlight ? [styles.highlight] : [])]}>{value}</Text>
    </View>
  );
}
