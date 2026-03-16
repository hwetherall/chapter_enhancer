import { forwardRef } from "react";
import type { WaterfallData } from "@/lib/visual-types";

interface Props {
  data: WaterfallData;
  title: string;
  caption?: string;
  insight?: string;
}

const COLOR_MAP: Record<string, string> = {
  add: "#059669",
  subtract: "#dc2626",
  total: "#1a1f36",
};

export const WaterfallVisual = forwardRef<HTMLDivElement, Props>(
  ({ data, title, caption, insight }, ref) => {
    const { items } = data;
    const svgWidth = 720;
    const svgHeight = 380;
    const chartLeft = 60;
    const chartRight = 20;
    const chartTop = 24;
    const chartBottom = 60;
    const chartW = svgWidth - chartLeft - chartRight;
    const chartH = svgHeight - chartTop - chartBottom;
    const barW = Math.min(56, (chartW / items.length) - 16);

    let running = 0;
    const computed = items.map((item) => {
      if (item.type === "total") {
        const start = 0;
        const end = running;
        return { ...item, start, end, barStart: Math.min(start, end), barH: Math.abs(end - start) };
      }
      const start = running;
      running += item.type === "add" ? item.value : -item.value;
      const end = running;
      return { ...item, start, end, barStart: Math.min(start, end), barH: Math.abs(end - start) };
    });

    const allVals = computed.flatMap((c) => [c.start, c.end]);
    const minVal = Math.min(0, ...allVals);
    const maxVal = Math.max(...allVals) * 1.15;
    const range = maxVal - minVal;

    const valToY = (v: number) => chartTop + chartH - ((v - minVal) / range) * chartH;

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
        {/* Title with accent bar */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
          <div style={{ width: 3, height: 22, backgroundColor: "#059669", borderRadius: 2, marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em", lineHeight: 1.3 }}>{title}</div>
            {caption && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3, fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", fontStyle: "italic" }}>{caption}</div>}
          </div>
        </div>

        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" style={{ display: "block", marginTop: 16 }}>
          <defs>
            {items.map((item, i) => {
              const color = COLOR_MAP[item.type] || "#64748b";
              return (
                <linearGradient key={`wf-grad-${i}`} id={`wf-grad-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={color} stopOpacity={1} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.8} />
                </linearGradient>
              );
            })}
          </defs>

          {/* Baseline at zero */}
          <line x1={chartLeft} y1={valToY(0)} x2={svgWidth - chartRight} y2={valToY(0)} stroke="#e2e8f0" strokeWidth={1} />

          {/* Subtle gridlines */}
          {[0.25, 0.5, 0.75, 1].map((pct) => {
            const v = minVal + pct * range;
            const y = valToY(v);
            return (
              <g key={pct}>
                <line x1={chartLeft} y1={y} x2={svgWidth - chartRight} y2={y} stroke="#f1f5f9" strokeWidth={1} />
                <text
                  x={chartLeft - 8}
                  y={y + 1}
                  textAnchor="end"
                  dominantBaseline="middle"
                  style={{ fontSize: 9, fill: "#cbd5e1", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}
                >
                  {Math.round(v).toLocaleString()}
                </text>
              </g>
            );
          })}

          {computed.map((item, i) => {
            const gap = (chartW - barW * items.length) / (items.length + 1);
            const x = chartLeft + gap + i * (barW + gap);
            const y = valToY(Math.max(item.start, item.end));
            const h = Math.max(2, (item.barH / range) * chartH);

            return (
              <g key={i}>
                {/* Bar */}
                <rect x={x} y={y} width={barW} height={h} rx={3} fill={`url(#wf-grad-${i})`} />

                {/* Highlight line at top */}
                <rect x={x + 2} y={y} width={barW - 4} height={2} rx={1} fill="rgba(255,255,255,0.3)" />

                {/* Connector to next bar */}
                {i < computed.length - 1 && item.type !== "total" && (
                  <line
                    x1={x + barW}
                    y1={valToY(item.end)}
                    x2={x + barW + gap}
                    y2={valToY(item.end)}
                    stroke="#cbd5e1"
                    strokeWidth={1}
                    strokeDasharray="4,3"
                  />
                )}

                {/* Value label */}
                <text
                  x={x + barW / 2}
                  y={y - 8}
                  textAnchor="middle"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    fill: "#0f172a",
                    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {item.displayValue}
                </text>

                {/* Category label */}
                <text
                  x={x + barW / 2}
                  y={chartTop + chartH + 18}
                  textAnchor="middle"
                  style={{ fontSize: 10, fill: "#64748b", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div style={{ display: "flex", gap: 20, marginTop: 8, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
          {[
            { color: "#059669", label: "Addition" },
            { color: "#dc2626", label: "Subtraction" },
            { color: "#1a1f36", label: "Total" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: item.color }} />
              <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>{item.label}</span>
            </div>
          ))}
        </div>

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

WaterfallVisual.displayName = "WaterfallVisual";
