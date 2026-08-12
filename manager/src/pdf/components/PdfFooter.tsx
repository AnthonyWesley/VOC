import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { colors, fontSize, spacing, fontFamily } from "../tokens";

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
    marginTop: spacing.xxl,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
  },
  left: {},
  right: {},
});

type Props = {
  documentId?: string;
  generatedAt?: Date;
};

export default function PdfFooter({ documentId, generatedAt }: Props) {
  const dateStr = generatedAt
    ? generatedAt.toLocaleString("pt-BR")
    : new Date().toLocaleString("pt-BR");

  return (
    <View style={styles.wrapper} fixed>
      <Text style={styles.left}>
        Documento{documentId ? ` #${documentId}` : ""} — Gerado em {dateStr}
      </Text>
      <Text
        style={styles.right}
        render={({ pageNumber, totalPages }) =>
          `Página ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  );
}
