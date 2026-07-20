import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { currencyFormatter } from "../../helpers/currencyFormatter";

const PALLETTE = [
  "#22d3ee", "#a78bfa", "#f472b6", "#fbbf24",
  "#60a5fa", "#fb923c", "#34d399", "#f87171",
  "#818cf8", "#fb7185", "#2dd4bf", "#e879f9",
];

interface CategoryItem {
  label: string;
  total: number;
  direction: string;
  pct: number;
}

interface Props {
  data: CategoryItem[];
}

export default function CategoryDoughnutChart({ data }: Props) {
  const option = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.total - a.total);

    return {
      tooltip: {
        trigger: "item" as const,
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        borderColor: "rgba(148, 163, 184, 0.15)",
        borderWidth: 1,
        padding: [12, 16],
        textStyle: { color: "#e2e8f0", fontSize: 12 },
        formatter: (params: { name: string; value: number; percent: number }) =>
          `<strong>${params.name}</strong><br/>` +
          `Valor: ${currencyFormatter.format(params.value)}<br/>` +
          `Participação: ${params.percent.toFixed(1)}%`,
      },
      legend: {
        orient: "vertical" as const,
        right: "5%",
        top: "center",
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 14,
        borderRadius: 3,
        textStyle: { color: "#94a3b8", fontSize: 11 },
        formatter: (name: string) => {
          const item = sorted.find((d) => d.label === name);
          return item
            ? `${name.padEnd(20, "\u00A0")}  ${item.pct.toFixed(1)}%`
            : name;
        },
      },
      series: [
        {
          type: "pie" as const,
          radius: "50%",
          center: ["38%", "50%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 4,
            borderColor: "rgba(15, 23, 42, 0.85)",
            borderWidth: 2,
          },
          label: {
            show: true,
            position: "outside" as const,
            formatter: (params: { name: string; value: number; percent: number }) =>
              `${params.name}\n${currencyFormatter.format(params.value)}`,
            color: "#cbd5e1",
            fontSize: 10,
            lineHeight: 14,
          },
          labelLine: {
            show: true,
            length: 10,
            length2: 14,
            lineStyle: { color: "rgba(148, 163, 184, 0.25)" },
          },
          emphasis: {
            scale: true,
            label: {
              show: true,
              fontSize: 12,
              fontWeight: "bold" as const,
              color: "#f1f5f9",
            },
            itemStyle: {
              shadowBlur: 14,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
          data: sorted.map((item, i) => ({
            value: item.total,
            name: item.label,
            itemStyle: {
              color: PALLETTE[i % PALLETTE.length],
            },
          })),
          animationDuration: 800,
          animationEasing: "cubicOut",
        },
      ],
    };
  }, [data]);

  return (
    <ReactECharts
      option={option}
      style={{ height: 320, width: "100%" }}
      notMerge
      lazyUpdate
    />
  );
}
