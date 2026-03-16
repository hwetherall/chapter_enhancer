import { forwardRef } from "react";
import type { HorizontalBarData } from "@/lib/visual-types";

const SERIES_COLORS = ["#1a1f36", "#2563eb", "#0ea5e9", "#059669", "#d97706", "#dc2626", "#7c3aed", "#64748b"];

interface Props {
  data: HorizontalBarData;
  title: string;
  caption?: string;
  insight?: string;
}

export const HorizontalBarVisual = forwardRef<HTMLDivElement, Props>(
  ({ data, title, caption, insight }, ref) => {
    const { bars, xAxisLabel, showValues = true, highlightIndex } = data;
    const maxVal = data.maxValue || Math.max(...bars.map((b) => b.value)) * 1.1;
    const barHeight = 28;
    const gap = 14;
    const labelWidth = 180;
    const chartWidth = 500;
    const svgWidth = 720;
    const topPad = 8;
    const svgHeight = bars.length * (barHeight + gap) + topPad + 40;

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
        {/* Title block with left accent bar */}
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
                <linearGradient key={`grad-${i}`} id={`hbar-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={color} stopOpacity={0.92} />
                  <stop offset="100%" stopColor={color} stopOpacity={1} />
                </linearGradient>
              );
            })}
            <filter id="hbar-shadow">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.06" />
            </filter>
          </defs>

          {/* Subtle baseline */}
          <line x1={labelWidth} y1={topPad} x2={labelWidth} y2={svgHeight - 30} stroke="#e2e8f0" strokeWidth={1} />

          {/* Light gridlines — just two for restraint */}
          {[0.5, 1].map((pct) => (
            <g key={pct}>
              <line
                x1={labelWidth + chartWidth * pct}
                y1={topPad}
                x2={labelWidth + chartWidth * pct}
                y2={svgHeight - 30}
                stroke="#f1f5f9"
                strokeWidth={1}
              />
              <text
                x={labelWidth + chartWidth * pct}
                y={svgHeight - 18}
                textAnchor="middle"
                style={{ fontSize: 9, fill: "#cbd5e1", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", letterSpacing: "0.03em" }}
              >
                {Math.round(maxVal * pct).toLocaleString()}
              </text>
            </g>
          ))}

          {bars.map((bar, i) => {
            const y = topPad + 4 + i * (barHeight + gap);
            const barW = Math.max(3, (bar.value / maxVal) * chartWidth);
            const isHighlighted = highlightIndex === i;

            return (
              <g key={i}>
                {/* Label — right-aligned, tighter to bars */}
                <text
                  x={labelWidth - 10}
                  y={y + barHeight / 2 + 1}
                  textAnchor="end"
                  dominantBaseline="middle"
                  style={{
                    fontSize: 11,
                    fill: isHighlighted ? "#0f172a" : "#475569",
                    fontWeight: isHighlighted ? 600 : 400,
                    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {bar.label}
                </text>

                {/* Bar with gradient fill and subtle shadow */}
                <rect
                  x={labelWidth}
                  y={y}
                  width={barW}
                  height={barHeight}
                  rx={3}
                  ry={3}
                  fill={`url(#hbar-grad-${i})`}
                  filter={isHighlighted ? "url(#hbar-shadow)" : undefined}
                />

                {/* Highlight accent — thin bright line at top of bar */}
                {isHighlighted && (
                  <rect x={labelWidth} y={y} width={barW} height={2} rx={1} fill="#2563eb" opacity={0.7} />
                )}

                {/* Value label — always outside for cleaner read */}
                {showValues && (
                  <text
                    x={labelWidth + barW + 10}
                    y={y + barHeight / 2 + 1}
                    textAnchor="start"
                    dominantBaseline="middle"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      fill: "#0f172a",
                      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {bar.displayValue}
                  </text>
                )}
              </g>
            );
          })}

          {xAxisLabel && (
            <text
              x={labelWidth + chartWidth / 2}
              y={svgHeight - 4}
              textAnchor="middle"
              style={{ fontSize: 9, fill: "#94a3b8", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" as const }}
            >
              {xAxisLabel}
            </text>
          )}
        </svg>

        {insight && (
          <div style={{
            fontSize: 12,
            color: "#64748b",
            marginTop: 16,
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

HorizontalBarVisual.displayName = "HorizontalBarVisual";
