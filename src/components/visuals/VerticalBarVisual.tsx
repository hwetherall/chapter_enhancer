import { forwardRef } from "react";
import type { VerticalBarData } from "@/lib/visual-types";

const SERIES_COLORS = ["#1a1f36", "#2563eb", "#0ea5e9", "#059669", "#d97706", "#dc2626", "#7c3aed", "#64748b"];

interface Props {
  data: VerticalBarData;
  title: string;
  caption?: string;
  insight?: string;
}

export const VerticalBarVisual = forwardRef<HTMLDivElement, Props>(
  ({ data, title, caption, insight }, ref) => {
    const { bars, yAxisLabel, showValues = true, groupLabel } = data;
    const maxVal = Math.max(...bars.map((b) => b.value)) * 1.18;
    const svgWidth = 720;
    const svgHeight = 380;
    const chartLeft = 56;
    const chartBottom = 56;
    const chartTop = 16;
    const chartRight = 24;
    const chartW = svgWidth - chartLeft - chartRight;
    const chartH = svgHeight - chartTop - chartBottom;
    const barW = Math.min(56, (chartW / bars.length) - 20);

    const gridCount = 4;
    const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
      const val = (maxVal / gridCount) * i;
      const y = chartTop + chartH - (val / maxVal) * chartH;
      return { val, y };
    });

    return (
      <div
        ref={ref}
        style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          maxWidth: 720,
          padding: "28px 32px",
          backgroundColor: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
          <div style={{ width: 3, height: 22, backgroundColor: "#2563eb", borderRadius: 2, marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em", lineHeight: 1.3 }}>{title}</div>
            {caption && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3, fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", fontStyle: "italic" }}>{caption}</div>}
          </div>
        </div>

        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" style={{ display: "block", marginTop: 16 }}>
          <defs>
            {bars.map((bar, i) => {
              const color = bar.color || SERIES_COLORS[i % SERIES_COLORS.length];
              return (
                <linearGradient key={`vbar-grad-${i}`} id={`vbar-grad-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={color} stopOpacity={1} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.8} />
                </linearGradient>
              );
            })}
          </defs>

          {/* Gridlines — subtle */}
          {gridLines.map((g, i) => (
            <g key={i}>
              <line x1={chartLeft} y1={g.y} x2={svgWidth - chartRight} y2={g.y} stroke={i === 0 ? "#e2e8f0" : "#f1f5f9"} strokeWidth={1} />
              {i > 0 && (
                <text
                  x={chartLeft - 8}
                  y={g.y + 1}
                  textAnchor="end"
                  dominantBaseline="middle"
                  style={{ fontSize: 9, fill: "#cbd5e1", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}
                >
                  {Math.round(g.val).toLocaleString()}
                </text>
              )}
            </g>
          ))}

          {/* Bars */}
          {bars.map((bar, i) => {
            const totalGap = chartW - barW * bars.length;
            const gapSize = totalGap / (bars.length + 1);
            const x = chartLeft + gapSize + i * (barW + gapSize);
            const barH = (bar.value / maxVal) * chartH;
            const y = chartTop + chartH - barH;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={4}
                  ry={4}
                  fill={`url(#vbar-grad-${i})`}
                />
                {/* Top highlight */}
                <rect x={x + 2} y={y} width={barW - 4} height={2} rx={1} fill="rgba(255,255,255,0.3)" />
                {showValues && (
                  <text
                    x={x + barW / 2}
                    y={y - 8}
                    textAnchor="middle"
                    style={{ fontSize: 11, fontWeight: 700, fill: "#0f172a", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", letterSpacing: "-0.01em" }}
                  >
                    {bar.displayValue}
                  </text>
                )}
                <text
                  x={x + barW / 2}
                  y={chartTop + chartH + 18}
                  textAnchor="middle"
                  style={{ fontSize: 10, fill: "#64748b", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}
                >
                  {bar.label}
                </text>
              </g>
            );
          })}

          {yAxisLabel && (
            <text
              x={14}
              y={chartTop + chartH / 2}
              textAnchor="middle"
              transform={`rotate(-90, 14, ${chartTop + chartH / 2})`}
              style={{ fontSize: 9, fill: "#94a3b8", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", letterSpacing: "0.06em" }}
            >
              {yAxisLabel}
            </text>
          )}

          {groupLabel && (
            <text
              x={svgWidth / 2}
              y={svgHeight - 8}
              textAnchor="middle"
              style={{ fontSize: 10, fill: "#94a3b8", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}
            >
              {groupLabel}
            </text>
          )}
        </svg>

        {insight && (
          <div style={{
            fontSize: 12,
            color: "#64748b",
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px solid #f1f5f9",
            fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
            lineHeight: 1.5,
          }}>
            <span style={{ fontWeight: 600, color: "#475569", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>INSIGHT</span>
            <br />
            {insight}
          </div>
        )}
      </div>
    );
  }
);

VerticalBarVisual.displayName = "VerticalBarVisual";
