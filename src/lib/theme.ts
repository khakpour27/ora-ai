export const theme = {
  colors: {
    background: {
      primary: "#0F172A",
      secondary: "#1E293B",
      card: "#1E293B",
      cardHover: "#334155",
    },
    accent: {
      emerald: "#10B981",
      teal: "#14B8A6",
      amber: "#F59E0B",
      sky: "#0EA5E9",
      rose: "#F43F5E",
      violet: "#8B5CF6",
    },
    text: {
      primary: "#F8FAFC",
      secondary: "#94A3B8",
      muted: "#64748B",
    },
    companies: {
      "frevar-kf": "#3B82F6",
      "kronos-titan": "#F59E0B",
      "kemira-chemicals": "#10B981",
      "denofa": "#8B5CF6",
      "batteriretur": "#EF4444",
      "metallco-stene": "#06B6D4",
      "saren-energi": "#F97316",
      "metallco-kabel": "#A855F7",
      "stene-stal": "#EC4899",
      "ng-metall": "#14B8A6",
      "fredrikstad-fjernvarme": "#E11D48",
      "borg-havn": "#6366F1",
    } as Record<string, string>,
    flows: {
      electricity: "#FBBF24",
      heat: "#EF4444",
      "waste-heat": "#FB923C",
      biogas: "#22C55E",
      hydrogen: "#38BDF8",
    } as Record<string, string>,
    status: {
      existing: "#10B981",
      potential: "#F59E0B",
      planned: "#8B5CF6",
    },
    confidence: {
      high: "#10B981",
      medium: "#F59E0B",
      low: "#EF4444",
    },
  },
  nivoTheme: {
    background: "transparent",
    text: { fill: "#94A3B8", fontSize: 12, fontFamily: "Inter, sans-serif" },
    axis: {
      ticks: {
        text: { fill: "#64748B", fontSize: 11, fontFamily: "Inter, sans-serif" },
      },
      legend: {
        text: { fill: "#94A3B8", fontSize: 13, fontFamily: "Inter, sans-serif" },
      },
    },
    grid: { line: { stroke: "#334155", strokeWidth: 1 } },
    tooltip: {
      container: {
        background: "#1E293B",
        color: "#F8FAFC",
        borderRadius: "8px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        border: "1px solid #334155",
        fontFamily: "Inter, sans-serif",
        fontSize: "13px",
      },
    },
    crosshair: { line: { stroke: "#10B981", strokeWidth: 1 } },
  },
};

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return theme.colors.confidence.high;
  if (confidence >= 0.5) return theme.colors.confidence.medium;
  return theme.colors.confidence.low;
}

export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return "High";
  if (confidence >= 0.5) return "Medium";
  return "Low";
}
