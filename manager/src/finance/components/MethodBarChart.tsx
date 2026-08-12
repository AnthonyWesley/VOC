import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { currencyFormatter } from "../../helpers/currencyFormatter";

const BAR_COLORS: Array<{ from: string; to: string }> = [
  { from: "#22d3ee", to: "#0891b2" },
  { from: "#a78bfa", to: "#7c3aed" },
  { from: "#f472b6", to: "#db2777" },
  { from: "#fbbf24", to: "#d97706" },
  { from: "#60a5fa", to: "#2563eb" },
  { from: "#fb923c", to: "#ea580c" },
  { from: "#34d399", to: "#059669" },
  { from: "#818cf8", to: "#4338ca" },
];

interface MethodItem {
  label: string;
  total: number;
  pct: number;
}

interface Props {
  data: MethodItem[];
  grandTotal: number;
}

export default function MethodBarChart({ data, grandTotal }: Props) {
  const option = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.total - a.total);
    const maxVal = sorted.length > 0 ? sorted[0].total : 1;

    return {
      tooltip: {
        trigger: "axis" as const,
        axisPointer: { type: "shadow" as const },
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        borderColor: "rgba(148, 163, 184, 0.15)",
        borderWidth: 1,
        padding: [12, 16],
        textStyle: { color: "#e2e8f0", fontSize: 12 },
        formatter: (params: { name: string; value: number }[]) => {
          const item = params[0];
          return `<strong>${item.name}</strong><br/>` +
            `Valor: ${currencyFormatter.format(item.value)}<br/>` +
            `Participação: ${grandTotal > 0 ? ((item.value / grandTotal) * 100).toFixed(1) : 0}%`;
        },
      },
      grid: {
        left: "2%",
        right: "20%",
        bottom: "2%",
        top: "2%",
        containLabel: true,
      },
      xAxis: {
        type: "value" as const,
        splitLine: {
          lineStyle: { color: "rgba(148, 163, 184, 0.06)", type: "dashed" as const },
        },
        axisLabel: { color: "#475569", fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false },
        max: maxVal * 1.25,
      },
      yAxis: {
        type: "category" as const,
        data: sorted.map((d) => d.label.replace("_", " ")),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "#94a3b8",
          fontSize: 11,
          fontWeight: 600,
        },
      },
      series: [
        {
          type: "bar" as const,
          barWidth: 14,
          barBorderRadius: [0, 6, 6, 0],
          animationDuration: 800,
          animationEasing: "cubicOut" as const,
          showBackground: true,
          backgroundStyle: {
            color: "rgba(148, 163, 184, 0.06)",
            borderRadius: [0, 6, 6, 0],
          },
          label: {
            show: true,
            position: "right" as const,
            formatter: (params: { value: number }) =>
              currencyFormatter.format(params.value),
            color: "#64748b",
            fontSize: 10,
          },
          data: sorted.map((item, i) => ({
            value: item.total,
            itemStyle: {
              color: {
                type: "linear" as const,
                x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: BAR_COLORS[i % BAR_COLORS.length].from },
                  { offset: 1, color: BAR_COLORS[i % BAR_COLORS.length].to },
                ],
                global: false,
              },
            },
          })),
        },
      ],
      animation: true,
    };
  }, [data, grandTotal]);

  return (
    <ReactECharts
      option={option}
      style={{ height: 300, width: "100%" }}
      notMerge
      lazyUpdate
    />
  );
}
