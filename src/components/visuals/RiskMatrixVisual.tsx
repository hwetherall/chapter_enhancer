import { forwardRef } from "react";
import type { RiskMatrixData } from "@/lib/visual-types";

interface Props {
  data: RiskMatrixData;
  title: string;
  caption?: string;
  insight?: string;
}

const CELL_COLORS: Record<string, { bg: string; border: string }> = {
  "High-High": { bg: "#fef2f2", border: "#fecaca" },
  "High-Medium": { bg: "#fff7ed", border: "#fed7aa" },
  "Medium-High": { bg: "#fff7ed", border: "#fed7aa" },
  "Medium-Medium": { bg: "#fffbeb", border: "#fde68a" },
  "Low-Low": { bg: "#f0fdf4", border: "#bbf7d0" },
  "Low-Medium": { bg: "#f0fdf4", border: "#bbf7d0" },
  "Medium-Low": { bg: "#f0fdf4", border: "#bbf7d0" },
  "High-Low": { bg: "#fffbeb", border: "#fde68a" },
  "Low-High": { bg: "#fffbeb", border: "#fde68a" },
};

const LEVELS = ["Low", "Medium", "High"] as const;

export const RiskMatrixVisual = forwardRef<HTMLDivElement, Props>(
  ({ data, title, caption, insight }, ref) => {
    const { risks } = data;
    const cellSize = 130;
    const svgWidth = 720;
    const gridW = cellSize * 3;
    const labelZone = 50;
    const offsetX = (svgWidth - gridW) / 2 + 10;
    const offsetY = 10;
    const svgHeight = gridW + offsetY + 60;

    const cellRisks: Record<string, typeof risks> = {};
    risks.forEach((r) => {
      const key = `${r.probability}-${r.severity}`;
      if (!cellRisks[key]) cellRisks[key] = [];
      cellRisks[key].push(r);
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
          <div style={{ width: 3, height: 22, backgroundColor: "#dc2626", borderRadius: 2, marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em", lineHeight: 1.3 }}>{title}</div>
            {caption && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3, fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", fontStyle: "italic" }}>{caption}</div>}
          </div>
        </div>

        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" style={{ display: "block", marginTop: 16 }}>
          <defs>
            <filter id="risk-pip-shadow">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Grid cells */}
          {LEVELS.map((prob, pi) => {
            const row = 2 - pi;
            return LEVELS.map((sev, si) => {
              const x = offsetX + si * cellSize;
              const y = offsetY + row * cellSize;
              const colors = CELL_COLORS[`${prob}-${sev}`] || { bg: "#f8fafc", border: "#e2e8f0" };
              const cellKey = `${prob}-${sev}`;
              const risksInCell = cellRisks[cellKey] || [];

              return (
                <g key={`${pi}-${si}`}>
                  <rect
                    x={x}
                    y={y}
                    width={cellSize}
                    height={cellSize}
                    fill={colors.bg}
                    stroke={colors.border}
                    strokeWidth={1}
                    rx={3}
                  />
                  {/* Risk pips */}
                  {risksInCell.map((r, ri) => {
                    const cols = Math.min(risksInCell.length, 3);
                    const rows = Math.ceil(risksInCell.length / 3);
                    const col = ri % cols;
                    const rw = Math.floor(ri / cols);
                    const spacing = 36;
                    const startX = x + cellSize / 2 - ((cols - 1) * spacing) / 2;
                    const startY = y + cellSize / 2 - ((rows - 1) * spacing) / 2;
                    const cx = startX + col * spacing;
                    const cy = startY + rw * spacing;

                    return (
                      <g key={ri} filter="url(#risk-pip-shadow)">
                        <circle cx={cx} cy={cy} r={15} fill="#1a1f36" />
                        <circle cx={cx} cy={cy} r={15} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
                        <text
                          x={cx}
                          y={cy + 1}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{ fontSize: 11, fontWeight: 700, fill: "#ffffff", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}
                        >
                          {r.id}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            });
          })}

          {/* Y-axis labels */}
          {LEVELS.map((level, i) => {
            const row = 2 - i;
            return (
              <text
                key={level}
                x={offsetX - 8}
                y={offsetY + row * cellSize + cellSize / 2}
                textAnchor="end"
                dominantBaseline="middle"
                style={{ fontSize: 10, fill: "#94a3b8", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", fontWeight: 500 }}
              >
                {level}
              </text>
            );
          })}

          {/* X-axis labels */}
          {LEVELS.map((level, i) => (
            <text
              key={level}
              x={offsetX + i * cellSize + cellSize / 2}
              y={offsetY + 3 * cellSize + 18}
              textAnchor="middle"
              style={{ fontSize: 10, fill: "#94a3b8", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", fontWeight: 500 }}
            >
              {level}
            </text>
          ))}

          {/* Axis titles */}
          <text
            x={offsetX - labelZone + 5}
            y={offsetY + (3 * cellSize) / 2}
            textAnchor="middle"
            transform={`rotate(-90, ${offsetX - labelZone + 5}, ${offsetY + (3 * cellSize) / 2})`}
            style={{ fontSize: 9, fontWeight: 600, fill: "#475569", letterSpacing: "0.1em", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}
          >
            PROBABILITY
          </text>
          <text
            x={offsetX + (3 * cellSize) / 2}
            y={offsetY + 3 * cellSize + 38}
            textAnchor="middle"
            style={{ fontSize: 9, fontWeight: 600, fill: "#475569", letterSpacing: "0.1em", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}
          >
            SEVERITY
          </text>
        </svg>

        {/* Legend — more refined layout */}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "6px 16px",
          }}>
            {risks.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    backgroundColor: "#1a1f36",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    flexShrink: 0,
                    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                  }}
                >
                  {r.id}
                </div>
                <span style={{ fontSize: 11, color: "#475569", lineHeight: 1.3, fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>{r.label}</span>
              </div>
            ))}
          </div>
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

RiskMatrixVisual.displayName = "RiskMatrixVisual";
