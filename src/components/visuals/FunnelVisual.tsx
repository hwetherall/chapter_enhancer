import { forwardRef } from "react";
import type { FunnelData } from "@/lib/visual-types";

interface Props {
  data: FunnelData;
  title: string;
  caption?: string;
  insight?: string;
}

export const FunnelVisual = forwardRef<HTMLDivElement, Props>(
  ({ data, title, caption, insight }, ref) => {
    const { stages } = data;
    const svgWidth = 660;
    const tierHeight = 64;
    const tierGap = 5;
    const totalHeight = stages.length * tierHeight + (stages.length - 1) * tierGap + 20;
    const maxWidth = 600;
    const narrowPer = stages.length > 1 ? 60 / (stages.length - 1) : 0;

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
          <div style={{ width: 3, height: 22, backgroundColor: "#2563eb", borderRadius: 2, marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em", lineHeight: 1.3 }}>{title}</div>
            {caption && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3, fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", fontStyle: "italic" }}>{caption}</div>}
          </div>
        </div>

        <svg
          viewBox={`0 0 ${svgWidth} ${totalHeight}`}
          width="100%"
          style={{ display: "block", marginTop: 24 }}
        >
          <defs>
            {stages.map((stage, i) => (
              <linearGradient key={`fg-${i}`} id={`funnel-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={stage.color} stopOpacity={0.9} />
                <stop offset="100%" stopColor={stage.color} stopOpacity={1} />
              </linearGradient>
            ))}
            <filter id="funnel-shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" />
            </filter>
          </defs>

          {stages.map((stage, i) => {
            const topW = maxWidth - i * narrowPer * 2;
            const bottomW = i < stages.length - 1 ? maxWidth - (i + 1) * narrowPer * 2 : topW * 0.85;
            const y = i * (tierHeight + tierGap);
            const centerX = svgWidth / 2;

            const topLeft = centerX - topW / 2;
            const topRight = centerX + topW / 2;
            const bottomLeft = centerX - bottomW / 2;
            const bottomRight = centerX + bottomW / 2;

            // Trapezoid with rounded-ish corners (using path)
            const r = 6;
            const points = `
              M ${topLeft + r} ${y}
              L ${topRight - r} ${y}
              Q ${topRight} ${y} ${topRight} ${y + r}
              L ${bottomRight} ${y + tierHeight - r}
              Q ${bottomRight} ${y + tierHeight} ${bottomRight - r} ${y + tierHeight}
              L ${bottomLeft + r} ${y + tierHeight}
              Q ${bottomLeft} ${y + tierHeight} ${bottomLeft} ${y + tierHeight - r}
              L ${topLeft} ${y + r}
              Q ${topLeft} ${y} ${topLeft + r} ${y}
              Z
            `;

            return (
              <g key={i} filter="url(#funnel-shadow)">
                <path d={points} fill={`url(#funnel-grad-${i})`} />
                {/* Inner highlight */}
                <line
                  x1={topLeft + r + 4}
                  y1={y + 2}
                  x2={topRight - r - 4}
                  y2={y + 2}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={1}
                  strokeLinecap="round"
                />

                {/* Label — left aligned inside */}
                <text
                  x={topLeft + 24}
                  y={y + tierHeight / 2 - 6}
                  dominantBaseline="middle"
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    fill: "rgba(255,255,255,0.6)",
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.08em",
                    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                  }}
                >
                  {stage.label}
                </text>

                {/* Sublabel */}
                {stage.sublabel && (
                  <text
                    x={topLeft + 24}
                    y={y + tierHeight / 2 + 10}
                    dominantBaseline="middle"
                    style={{
                      fontSize: 10,
                      fill: "rgba(255,255,255,0.35)",
                      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                    }}
                  >
                    {stage.sublabel}
                  </text>
                )}

                {/* Value — right aligned, large and bold */}
                <text
                  x={topRight - 24}
                  y={y + tierHeight / 2 + 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    fill: "#ffffff",
                    letterSpacing: "-0.02em",
                    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                  }}
                >
                  {stage.value}
                </text>
              </g>
            );
          })}
        </svg>

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

FunnelVisual.displayName = "FunnelVisual";
