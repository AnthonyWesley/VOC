import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { colors, fontSize, spacing, fontFamily } from "../tokens";
import { formatCurrency, formatDateTime, paymentMethodLabel } from "../helpers";
import PdfHeader from "../components/PdfHeader";
import PdfFooter from "../components/PdfFooter";
import PdfSection from "../components/PdfSection";
import PdfCard from "../components/PdfCard";
import PdfInfoRow from "../components/PdfInfoRow";
import PdfStatusBadge from "../components/PdfStatusBadge";
import type { ReceiptPdfData } from "../types";

const styles = StyleSheet.create({
  page: {
    padding: spacing.section,
    fontFamily: fontFamily.regular,
    backgroundColor: colors.background,
  },
  amountWrapper: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  amountLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  amountValue: {
    fontSize: 28,
    fontFamily: fontFamily.bold,
    marginBottom: spacing.sm,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  hashText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontFamily: fontFamily.mono,
  },
});

type Props = {
  data: ReceiptPdfData;
};

export default function FinancialReceipt({ data }: Props) {
  const { organization, transaction, audit } = data;
  const isIncome = transaction.type === "INCOME";

  const recordedByLabel = transaction.recordedByRole
    ? `${transaction.recordedBy} (${transaction.recordedByRole})`
    : transaction.recordedBy;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfHeader
          title="Comprovante Financeiro"
          subtitle={organization.name}
          documentId={audit.documentId}
        />

        <View style={styles.amountWrapper}>
          <Text style={styles.amountLabel}>Valor da Transação</Text>
          <Text
            style={[
              styles.amountValue,
              { color: isIncome ? colors.highlight.income : colors.highlight.expense },
            ]}
          >
            {isIncome ? "+ " : "- "}{formatCurrency(transaction.amount)}
          </Text>
          <PdfStatusBadge
            label={isIncome ? "Entrada" : "Saída"}
            variant={isIncome ? "success" : "error"}
          />
        </View>

        <PdfSection title="Detalhes">
          <PdfCard>
            <PdfInfoRow label="Categoria" value={transaction.category} highlight />
            <PdfInfoRow label="Data" value={formatDateTime(transaction.date)} />
            <PdfInfoRow label="Método" value={paymentMethodLabel(transaction.method)} />
            {transaction.description && (
              <PdfInfoRow label="Descrição" value={transaction.description} />
            )}
            {transaction.memberName && (
              <PdfInfoRow label="Membro" value={transaction.memberName} />
            )}
            {transaction.eventName && (
              <PdfInfoRow label="Evento" value={transaction.eventName} />
            )}
          </PdfCard>
        </PdfSection>

        {transaction.status === "cancelled" && (
          <PdfSection title="Cancelamento">
            <PdfCard>
              <PdfStatusBadge label="Cancelado" variant="error" />
              {transaction.cancelReason && (
                <PdfInfoRow label="Motivo" value={transaction.cancelReason} />
              )}
            </PdfCard>
          </PdfSection>
        )}

        <View style={styles.footerRow}>
          <View>
            <Text style={{ fontSize: fontSize.sm, color: colors.text, marginBottom: 2 }}>
              {recordedByLabel}
            </Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
              ID: {transaction.id.slice(0, 13).toUpperCase()} · Doc: #{audit.documentId}
            </Text>
          </View>
          <Text style={styles.hashText}>
            #{audit.hash?.slice(0, 12) ?? audit.documentId}
          </Text>
        </View>

        <PdfFooter documentId={audit.documentId} generatedAt={audit.generatedAt} />
      </Page>
    </Document>
  );
}
