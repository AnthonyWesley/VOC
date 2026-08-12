import { Document, Page, StyleSheet } from "@react-pdf/renderer";
import { colors, spacing, fontFamily } from "../tokens";
import {
  formatCurrency,
  formatMonthYear,
  paymentMethodLabel,
} from "../helpers";
import PdfHeader from "../components/PdfHeader";
import PdfFooter from "../components/PdfFooter";
import PdfSection from "../components/PdfSection";
import PdfCard from "../components/PdfCard";
import PdfInfoRow from "../components/PdfInfoRow";
import PdfAmountHighlight from "../components/PdfAmountHighlight";
import PdfTable from "../components/PdfTable";
import type { Column } from "../components/PdfTable";
import type { FinancialReportPdfData } from "../types";

const styles = StyleSheet.create({
  page: {
    padding: spacing.section,
    fontFamily: fontFamily.regular,
    backgroundColor: colors.background,
  },
});

type Props = {
  data: FinancialReportPdfData;
};

export default function FinancialReport({ data }: Props) {
  const { organization, period, summary, records, audit } = data;
  const periodLabel = formatMonthYear(period.month, period.year);

  const columns: Column[] = [
    { key: "date", label: "Data", width: "15%" },
    { key: "category", label: "Categoria", width: "25%" },
    { key: "type", label: "Tipo", width: "12%", align: "center" },
    { key: "method", label: "Método", width: "18%" },
    { key: "description", label: "Descrição", width: "18%" },
    { key: "amount", label: "Valor", width: "12%", align: "right", highlight: true },
  ];

  const tableData = records.map((r) => ({
    date: r.date.toLocaleDateString("pt-BR"),
    category: r.category,
    type: r.type === "INCOME" ? "Entrada" : "Saída",
    method: paymentMethodLabel(r.method),
    description: r.description ?? "-",
    amount: formatCurrency(r.amount),
  }));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfHeader
          title="Relatório Financeiro"
          subtitle={`${organization.name} — ${periodLabel}`}
          documentId={audit.documentId}
        />

        <PdfSection title="Indicadores">
          <PdfAmountHighlight
            items={[
              {
                label: "Entradas",
                value: formatCurrency(summary.income),
                color: "income",
              },
              {
                label: "Saídas",
                value: formatCurrency(summary.expense),
                color: "expense",
              },
              {
                label: "Saldo",
                value: formatCurrency(summary.balance),
                color: summary.balance >= 0 ? "info" : "expense",
              },
            ]}
          />
          <PdfCard>
            <PdfInfoRow
              label="Total de transações"
              value={String(summary.totalTransactions)}
            />
            <PdfInfoRow label="Período" value={periodLabel} />
          </PdfCard>
        </PdfSection>

        {summary.byCategory && summary.byCategory.length > 0 && (
          <PdfSection title="Por Categoria">
            <PdfCard>
              {summary.byCategory.map((cat, i) => (
                <PdfInfoRow
                  key={i}
                  label={`${cat.name} (${cat.direction === "INCOME" ? "Entrada" : "Saída"})`}
                  value={formatCurrency(cat.total)}
                  highlight
                />
              ))}
            </PdfCard>
          </PdfSection>
        )}

        {summary.byMethod && summary.byMethod.length > 0 && (
          <PdfSection title="Por Método">
            <PdfCard>
              {summary.byMethod.map((m, i) => (
                <PdfInfoRow
                  key={i}
                  label={paymentMethodLabel(m.method)}
                  value={formatCurrency(m.total)}
                  highlight
                />
              ))}
            </PdfCard>
          </PdfSection>
        )}

        <PdfSection title="Movimentações">
          <PdfTable columns={columns} data={tableData} />
        </PdfSection>

        <PdfFooter
          documentId={audit.documentId}
          generatedAt={audit.generatedAt}
        />
      </Page>
    </Document>
  );
}
