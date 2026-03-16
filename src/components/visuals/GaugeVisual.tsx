import { forwardRef } from "react";
import type { GaugeData } from "@/lib/visual-types";

interface Props {
  data: GaugeData;
  title: string;
  caption?: string;
  insight?: string;
}

export const GaugeVisual = forwardRef<HTMLDivElement, Props>(
  ({ data, title, caption, insight }, ref) => {
    const { value, displayValue, label, thresholds } = data;
    const r = 80;
    const cx = 120;
    const cy = 100;
    const strokeW = 16;

    const circumference = Math.PI * r;
    const fillLength = (Math.min(100, Math.max(0, value)) / 100) * circumference;

    let fillColor = "#059669";
    let fillBg = "#f0fdf4";
    if (value >= thresholds.amber) { fillColor = "#dc2626"; fillBg = "#fef2f2"; }
    else if (value >= thresholds.green) { fillColor = "#d97706"; fillBg = "#fffbeb"; }

    const startX = cx - r;
    const startY = cy;
    const endX = cx + r;
    const endY = cy;

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
          <div style={{ width: 3, height: 22, backgroundColor: fillColor, borderRadius: 2, marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em", lineHeight: 1.3 }}>{title}</div>
            {caption && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3, fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", fontStyle: "italic" }}>{caption}</div>}
          </div>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 16,
          padding: "24px 0 8px",
          backgroundColor: fillBg,
          borderRadius: 12,
        }}>
          <div style={{ textAlign: "center" }}>
            <svg viewBox="0 0 240 130" width="240" style={{ display: "block", margin: "0 auto" }}>
              <defs>
                <linearGradient id="gauge-fill-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={fillColor} stopOpacity={0.7} />
                  <stop offset="100%" stopColor={fillColor} stopOpacity={1} />
                </linearGradient>
                <filter id="gauge-shadow">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={fillColor} floodOpacity="0.2" />
                </filter>
              </defs>

              {/* Background arc */}
              <path
                d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={strokeW}
                strokeLinecap="round"
              />
              {/* Fill arc */}
              <path
                d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
                fill="none"
                stroke="url(#gauge-fill-grad)"
                strokeWidth={strokeW}
                strokeLinecap="round"
                strokeDasharray={`${fillLength} ${circumference}`}
                filter="url(#gauge-shadow)"
              />

              {/* Tick marks */}
              {[0, 25, 50, 75, 100].map((tick) => {
                const angle = Math.PI - (tick / 100) * Math.PI;
                const outerR = r + strokeW / 2 + 4;
                const innerR = r + strokeW / 2 + 8;
                const x1 = cx + Math.cos(angle) * outerR;
                const y1 = cy - Math.sin(angle) * outerR;
                const x2 = cx + Math.cos(angle) * innerR;
                const y2 = cy - Math.sin(angle) * innerR;
                return (
                  <line key={tick} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth={1} />
                );
              })}

              {/* Center value */}
              <text
                x={cx}
                y={cy - 12}
                textAnchor="middle"
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  fill: "#0f172a",
                  letterSpacing: "-0.02em",
                  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                }}
              >
                {displayValue}
              </text>
              <text
                x={cx}
                y={cy + 10}
                textAnchor="middle"
                style={{
                  fontSize: 10,
                  fill: "#94a3b8",
                  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase" as const,
                }}
              >
                {label}
              </text>
            </svg>

            {/* Threshold labels */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: 20,
              marginTop: 8,
            }}>
              <span style={{ fontSize: 10, color: "#059669", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", fontWeight: 500 }}>
                ● 0–{thresholds.green}%
              </span>
              <span style={{ fontSize: 10, color: "#d97706", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", fontWeight: 500 }}>
                ● {thresholds.green}–{thresholds.amber}%
              </span>
              <span style={{ fontSize: 10, color: "#dc2626", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", fontWeight: 500 }}>
                ● {thresholds.amber}–100%
              </span>
            </div>
          </div>
        </div>

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

GaugeVisual.displayName = "GaugeVisual";
