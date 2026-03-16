import { forwardRef } from "react";
import type { ScorecardData } from "@/lib/visual-types";

interface Props {
  data: ScorecardData;
  title: string;
  caption?: string;
  insight?: string;
}

const STATUS_ACCENT: Record<string, string> = {
  positive: "#059669",
  warning: "#d97706",
  negative: "#dc2626",
  neutral: "#64748b",
};

const TREND_CHAR: Record<string, string> = {
  up: "▲",
  down: "▼",
  flat: "—",
};

export const ScorecardVisual = forwardRef<HTMLDivElement, Props>(
  ({ data, title, caption, insight }, ref) => {
    const { metrics, columns = 4 } = data;
    const cols = Math.min(columns, 4);
    const heroMetrics = metrics.slice(0, cols);
    const supportMetrics = metrics.slice(cols);

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

        {/* Hero metrics — dark strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            backgroundColor: "#0f172a",
            borderRadius: supportMetrics.length > 0 ? "8px 8px 0 0" : 8,
            marginTop: 20,
            overflow: "hidden",
          }}
        >
          {heroMetrics.map((metric, i) => {
            const accent = STATUS_ACCENT[metric.status] || STATUS_ACCENT.neutral;
            const trend = metric.trend ? TREND_CHAR[metric.trend] : null;
            return (
              <div
                key={i}
                style={{
                  padding: "22px 20px 18px",
                  borderRight: i < cols - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  position: "relative",
                }}
              >
                {/* Accent dot */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: accent, flexShrink: 0 }} />
                  <div style={{
                    fontSize: 9,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.1em",
                    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                    lineHeight: 1,
                  }}>
                    {metric.label}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{
                    fontSize: 30,
                    fontWeight: 700,
                    color: "#ffffff",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                  }}>
                    {metric.value}
                  </span>
                  {trend && (
                    <span style={{
                      fontSize: 9,
                      color: accent,
                      fontWeight: 700,
                      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                    }}>
                      {trend}
                    </span>
                  )}
                </div>

                {metric.sublabel && (
                  <div style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.35)",
                    marginTop: 6,
                    lineHeight: 1.3,
                    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                  }}>
                    {metric.sublabel}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Supporting metrics — light strip */}
        {supportMetrics.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(cols, supportMetrics.length)}, 1fr)`,
              backgroundColor: "#f8fafc",
              borderRadius: "0 0 8px 8px",
              border: "1px solid #e2e8f0",
              borderTop: "none",
              overflow: "hidden",
            }}
          >
            {supportMetrics.map((metric, i) => {
              const accent = STATUS_ACCENT[metric.status] || STATUS_ACCENT.neutral;
              const trend = metric.trend ? TREND_CHAR[metric.trend] : null;
              return (
                <div
                  key={i}
                  style={{
                    padding: "18px 20px 14px",
                    borderRight: i < Math.min(cols, supportMetrics.length) - 1 ? "1px solid #e2e8f0" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: accent, flexShrink: 0 }} />
                    <div style={{
                      fontSize: 9,
                      fontWeight: 500,
                      color: "#94a3b8",
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.1em",
                      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                      lineHeight: 1,
                    }}>
                      {metric.label}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                    <span style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: "#0f172a",
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                    }}>
                      {metric.value}
                    </span>
                    {trend && (
                      <span style={{
                        fontSize: 8,
                        color: accent,
                        fontWeight: 700,
                        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                      }}>
                        {trend}
                      </span>
                    )}
                  </div>

                  {metric.sublabel && (
                    <div style={{
                      fontSize: 11,
                      color: "#94a3b8",
                      marginTop: 4,
                      lineHeight: 1.3,
                      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                    }}>
                      {metric.sublabel}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

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

ScorecardVisual.displayName = "ScorecardVisual";
