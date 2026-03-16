import { forwardRef } from "react";
import type { DonutData } from "@/lib/visual-types";

interface Props {
  data: DonutData;
  title: string;
  caption?: string;
  insight?: string;
}

const DEFAULT_SIZE = 260;

function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return typeof n === "number" && !Number.isNaN(n) && n > 0 ? n : DEFAULT_SIZE;
}

export const DonutVisual = forwardRef<HTMLDivElement, Props>(
  ({ data, title, caption, insight }, ref) => {
    const { segments, centerLabel, centerSubLabel } = data;
    const size = toNumber(data.size);
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    const outerR = size / 2;
    const innerR = outerR * 0.62;
    const strokeWidth = outerR - innerR;
    const midR = (outerR + innerR) / 2;
    const circumference = 2 * Math.PI * midR;
    const cx = 240;
    const cy = size / 2 + 16;
    const svgH = size + 32;

    let cumulativeOffset = 0;
    const arcs = segments.map((seg) => {
      const pct = total > 0 ? seg.value / total : 0;
      const dashLength = circumference * pct;
      const gapSize = segments.length > 1 ? 3 : 0;
      const offset = circumference * cumulativeOffset;
      cumulativeOffset += pct;
      return { ...seg, dashLength: Math.max(0, dashLength - gapSize), offset: offset + gapSize / 2 };
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

        <div style={{ display: "flex", alignItems: "center", gap: 40, marginTop: 20 }}>
          {/* Donut */}
          <svg viewBox={`0 0 ${cx * 2} ${svgH}`} width={cx * 2} style={{ display: "block", flexShrink: 0 }}>
            <defs>
              <filter id="donut-glow">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodOpacity="0.08" />
              </filter>
            </defs>
            {/* Subtle background ring */}
            <circle cx={cx} cy={cy} r={midR} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
            {/* Segments with small gaps */}
            {arcs.map((arc, i) => (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={midR}
                fill="none"
                stroke={arc.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${arc.dashLength} ${circumference - arc.dashLength}`}
                strokeDashoffset={-arc.offset}
                strokeLinecap="round"
                transform={`rotate(-90 ${cx} ${cy})`}
                filter="url(#donut-glow)"
              />
            ))}
            {/* Center content */}
            <text
              x={cx}
              y={centerSubLabel ? cy - 4 : cy + 4}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontSize: 32, fontWeight: 700, fill: "#0f172a", letterSpacing: "-0.02em", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}
            >
              {centerLabel}
            </text>
            {centerSubLabel && (
              <text
                x={cx}
                y={cy + 22}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontSize: 11, fill: "#94a3b8", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", letterSpacing: "0.04em" }}
              >
                {centerSubLabel}
              </text>
            )}
          </svg>

          {/* Legend — vertical, to the right */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 160 }}>
            {segments.map((seg, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: seg.color,
                  flexShrink: 0,
                  boxShadow: `0 0 0 3px ${seg.color}22`,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#475569", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", fontWeight: 500, lineHeight: 1.2 }}>
                    {seg.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
                    {seg.displayValue}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {insight && (
          <div style={{
            fontSize: 12,
            color: "#64748b",
            marginTop: 20,
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

DonutVisual.displayName = "DonutVisual";
