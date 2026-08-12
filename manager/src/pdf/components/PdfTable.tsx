import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { colors, fontSize, spacing, fontFamily, borderRadius } from "../tokens";

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    borderTopLeftRadius: borderRadius,
    borderTopRightRadius: borderRadius,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headerCell: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.textInverse,
    letterSpacing: 0.5,
  },
  bodyRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  bodyCell: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  bodyCellHighlight: {
    fontFamily: fontFamily.bold,
  },
  bodyCellMuted: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  footerRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderBottomLeftRadius: borderRadius,
    borderBottomRightRadius: borderRadius,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  footerCell: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.text,
  },
});

export type Column = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  width?: string;
  highlight?: boolean;
  muted?: boolean;
};

type Props = {
  columns: Column[];
  data: Array<Record<string, string | number>>;
  footer?: Array<string | number>;
};

export default function PdfTable({ columns, data, footer }: Props) {
  const colWidth = `${Math.floor(100 / columns.length)}%`;

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        {columns.map((col, i) => (
          <Text
            key={i}
            style={[
              styles.headerCell,
              { 
                width: col.width ?? colWidth,
                textAlign: col.align ?? "left",
              },
            ]}
          >
            {col.label}
          </Text>
        ))}
      </View>

      {data.map((row, i) => (
        <View key={i} style={[styles.bodyRow, ...(i % 2 === 1 ? [{ backgroundColor: colors.surface }] : [])]}>
          {columns.map((col, j) => (
            <Text
              key={j}
              style={[
                styles.bodyCell,
                ...(col.highlight ? [styles.bodyCellHighlight] : []),
                ...(col.muted ? [styles.bodyCellMuted] : []),
                {
                  width: col.width ?? colWidth,
                  textAlign: col.align ?? "left",
                },
              ]}
            >
              {row[col.key] ?? ""}
            </Text>
          ))}
        </View>
      ))}

      {footer && (
        <View style={styles.footerRow}>
          {footer.map((val, i) => (
            <Text
              key={i}
              style={[
                styles.footerCell,
                {
                  width: columns[i]?.width ?? colWidth,
                  textAlign: columns[i]?.align ?? "left",
                },
              ]}
            >
              {val}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
