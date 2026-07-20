import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { colors, fontSize, spacing, fontFamily } from "../tokens";

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.section,
    paddingTop: spacing.xxl,
  },
  line: {
    width: 200,
    borderTopWidth: 1,
    borderTopColor: colors.text,
    marginBottom: spacing.sm,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});

type Props = {
  label?: string;
};

export default function PdfSignatureArea({ label = "Assinatura" }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
