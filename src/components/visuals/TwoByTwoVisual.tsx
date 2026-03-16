import { forwardRef } from "react";
import type { TwoByTwoData } from "@/lib/visual-types";

const DEFAULT_COLORS = ["#1a1f36", "#2563eb", "#0ea5e9", "#059669", "#d97706", "#dc2626", "#7c3aed", "#64748b"];

interface Props {
  data: TwoByTwoData;
  title: string;
  caption?: string;
  insight?: string;
}

export const TwoByTwoVisual = forwardRef<HTMLDivElement, Props>(
  ({ data, title, caption, insight }, ref) => {
    const { xAxis, yAxis, items, quadrantLabels } = data;
    const gridSize = 420;
    const svgWidth = 720;
    const offsetX = (svgWidth - gridSize) / 2;
    const offsetY = 24;
    const svgHeight = gridSize + offsetY + 48;

    const quadrants = [
      { x: 0, y: 0, bg: "rgba(220,38,38,0.03)", label: quadrantLabels?.topLeft },
      { x: 1, y: 0, bg: "rgba(5,150,105,0.04)", label: quadrantLabels?.topRight },
      { x: 0, y: 1, bg: "rgba(100,116,139,0.03)", label: quadrantLabels?.bottomLeft },
      { x: 1, y: 1, bg: "rgba(217,119,6,0.03)", label: quadrantLabels?.bottomRight },
    ];

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
          <div style={{ width: 3, height: 22, backgroundColor: "#7c3aed", borderRadius: 2, marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em", lineHeight: 1.3 }}>{title}</div>
            {caption && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3, fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", fontStyle: "italic" }}>{caption}</div>}
          </div>
        </div>

        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" style={{ display: "block", marginTop: 16 }}>
          <defs>
            <filter id="tbt-shadow">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Quadrant backgrounds */}
          {quadrants.map((q, i) => (
            <g key={i}>
              <rect
                x={offsetX + q.x * (gridSize / 2)}
                y={offsetY + q.y * (gridSize / 2)}
                width={gridSize / 2}
                height={gridSize / 2}
                fill={q.bg}
                rx={q.x === 0 && q.y === 0 ? "8 0 0 0" : q.x === 1 && q.y === 0 ? "0 8 0 0" : q.x === 0 ? "0 0 0 8" : "0 0 8 0"}
              />
              {q.label && (
                <text
                  x={offsetX + q.x * (gridSize / 2) + gridSize / 4}
                  y={offsetY + q.y * (gridSize / 2) + gridSize / 4}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ fontSize: 11, fill: "#d1d5db", fontWeight: 500, fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", letterSpacing: "0.02em" }}
                >
                  {q.label}
                </text>
              )}
            </g>
          ))}

          {/* Grid border */}
          <rect x={offsetX} y={offsetY} width={gridSize} height={gridSize} fill="none" stroke="#e2e8f0" strokeWidth={1} rx={8} />

          {/* Axis crosshairs */}
          <line x1={offsetX} y1={offsetY + gridSize / 2} x2={offsetX + gridSize} y2={offsetY + gridSize / 2} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="6,4" />
          <line x1={offsetX + gridSize / 2} y1={offsetY} x2={offsetX + gridSize / 2} y2={offsetY + gridSize} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="6,4" />

          {/* Items as labelled bubbles */}
          {items.map((item, i) => {
            const cx = offsetX + (item.x / 100) * gridSize;
            const cy = offsetY + gridSize - (item.y / 100) * gridSize;
            const r = item.size || 18;
            const color = item.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
            return (
              <g key={i} filter="url(#tbt-shadow)">
                <circle cx={cx} cy={cy} r={r} fill={color} opacity={0.9} />
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                <text
                  x={cx}
                  y={cy + r + 14}
                  textAnchor="middle"
                  style={{ fontSize: 10, fontWeight: 600, fill: "#1e293b", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}
                >
                  {item.label}
                </text>
              </g>
            );
          })}

          {/* Axis labels */}
          <text
            x={offsetX + gridSize / 2}
            y={offsetY + gridSize + 32}
            textAnchor="middle"
            style={{ fontSize: 10, fontWeight: 600, fill: "#475569", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", letterSpacing: "0.04em" }}
          >
            {xAxis.label}
          </text>
          <text x={offsetX} y={offsetY + gridSize + 32} textAnchor="start" style={{ fontSize: 9, fill: "#94a3b8", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
            {xAxis.lowLabel}
          </text>
          <text x={offsetX + gridSize} y={offsetY + gridSize + 32} textAnchor="end" style={{ fontSize: 9, fill: "#94a3b8", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
            {xAxis.highLabel}
          </text>

          <text
            x={offsetX - 28}
            y={offsetY + gridSize / 2}
            textAnchor="middle"
            transform={`rotate(-90, ${offsetX - 28}, ${offsetY + gridSize / 2})`}
            style={{ fontSize: 10, fontWeight: 600, fill: "#475569", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", letterSpacing: "0.04em" }}
          >
            {yAxis.label}
          </text>
          <text x={offsetX - 6} y={offsetY + gridSize - 4} textAnchor="end" style={{ fontSize: 9, fill: "#94a3b8", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
            {yAxis.lowLabel}
          </text>
          <text x={offsetX - 6} y={offsetY + 12} textAnchor="end" style={{ fontSize: 9, fill: "#94a3b8", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
            {yAxis.highLabel}
          </text>
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

TwoByTwoVisual.displayName = "TwoByTwoVisual";
