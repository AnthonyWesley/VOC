import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { colors, spacing, fontFamily, fontSize, borderRadius } from "../tokens";
import {
  formatCurrency,
  formatDateTime,
  eventTypeLabel,
} from "../helpers";
import PdfHeader from "../components/PdfHeader";
import PdfFooter from "../components/PdfFooter";
import PdfSection from "../components/PdfSection";
import PdfCard from "../components/PdfCard";
import PdfInfoRow from "../components/PdfInfoRow";
import PdfAmountHighlight from "../components/PdfAmountHighlight";
import PdfTable from "../components/PdfTable";
import type { Column } from "../components/PdfTable";
import type { EventReportPdfData } from "../types";

const styles = StyleSheet.create({
  page: {
    padding: spacing.section,
    fontFamily: fontFamily.regular,
    backgroundColor: colors.background,
  },
  chipWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
});

type Props = {
  data: EventReportPdfData;
};

export default function EventReport({ data }: Props) {
  const { organization, event, audit } = data;

  const columns: Column[] = [
    { key: "member", label: "Membro", width: "40%" },
    { key: "ministry", label: "Ministério", width: "40%" },
    { key: "description", label: "Descrição", width: "20%", align: "right" },
  ];

  const assignmentData = (event.assignments ?? []).map((a) => ({
    member: a.memberName,
    ministry: a.ministry,
    description: a.description ?? "-",
  }));

  const finColumns: Column[] = [
    { key: "category", label: "Categoria", width: "30%" },
    { key: "type", label: "Tipo", width: "15%", align: "center" },
    { key: "method", label: "Método", width: "15%" },
    { key: "recordedBy", label: "Registrado por", width: "20%" },
    { key: "amount", label: "Valor", width: "20%", align: "right", highlight: true },
  ];

  const finData = (event.financialRecords ?? []).map((fr) => ({
    category: fr.category,
    type: fr.direction === "INCOME" ? "Entrada" : "Saída",
    method: fr.method.replace(/_/g, " "),
    recordedBy: fr.recordedByRole
      ? `${fr.recordedBy} (${fr.recordedByRole})`
      : fr.recordedBy ?? "-",
    amount: formatCurrency(fr.amount),
  }));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfHeader
          title="Relatório de Evento"
          subtitle={`${organization.name} — ${event.title ?? eventTypeLabel(event.type)}`}
          documentId={audit.documentId}
        />

        <PdfSection title="Informações Gerais">
          <PdfCard>
            <PdfInfoRow
              label="Título"
              value={event.title ?? eventTypeLabel(event.type)}
              highlight
            />
            <PdfInfoRow
              label="Tipo"
              value={eventTypeLabel(event.type)}
            />
            <PdfInfoRow
              label="Início"
              value={formatDateTime(event.startsAt)}
            />
            {event.endsAt && (
              <PdfInfoRow label="Fim" value={formatDateTime(event.endsAt)} />
            )}
            {event.theme && (
              <PdfInfoRow label="Tema" value={event.theme} />
            )}
            {event.notes && (
              <PdfInfoRow label="Observações" value={event.notes} />
            )}
            <PdfInfoRow
              label="Preletor"
              value={event.preacherName ?? "Não definido"}
            />
            {audit.createdBy && (
              <PdfInfoRow
                label="Criado por"
                value={
                  audit.createdByRole
                    ? `${audit.createdBy} (${audit.createdByRole})`
                    : audit.createdBy
                }
              />
            )}
          </PdfCard>
        </PdfSection>

        <PdfSection title="Presença">
          <PdfAmountHighlight
            items={[
              {
                label: "Membros",
                value: String(event.membersCount),
                color: "info",
              },
              {
                label: "Visitantes",
                value: String(event.visitorsCount),
                color: "neutral",
              },
              {
                label: "Total",
                value: String(event.membersCount + event.visitorsCount),
                color: "income",
              },
            ]}
          />

          {event.members && event.members.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>
                Membros Presentes ({event.members.length})
              </Text>
              <View style={styles.chipWrapper}>
                {event.members.map((m, i) => (
                  <Text key={i} style={styles.chip}>
                    {m.name}
                  </Text>
                ))}
              </View>
            </>
          )}
        </PdfSection>

        {event.assignments && event.assignments.length > 0 && (
          <PdfSection title="Escala">
            <PdfTable columns={columns} data={assignmentData} />
          </PdfSection>
        )}

        {event.financialRecords && event.financialRecords.length > 0 && (
          <PdfSection title="Financeiro">
            {event.financialSummary && (
              <PdfAmountHighlight
                items={[
                  {
                    label: "Entradas",
                    value: formatCurrency(event.financialSummary.income),
                    color: "income",
                  },
                  {
                    label: "Saídas",
                    value: formatCurrency(event.financialSummary.expense),
                    color: "expense",
                  },
                  {
                    label: "Saldo",
                    value: formatCurrency(event.financialSummary.balance),
                    color:
                      (event.financialSummary.balance ?? 0) >= 0
                        ? "info"
                        : "expense",
                  },
                ]}
              />
            )}
            <PdfTable columns={finColumns} data={finData} />
          </PdfSection>
        )}

        <PdfFooter
          documentId={audit.documentId}
          generatedAt={audit.generatedAt}
        />
      </Page>
    </Document>
  );
}
