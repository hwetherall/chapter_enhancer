import { forwardRef } from "react";
import type { FlowDiagramData } from "@/lib/visual-types";

interface Props {
  data: FlowDiagramData;
  title: string;
  caption?: string;
  insight?: string;
}

const STATUS_STYLES: Record<string, {
  border: string; bg: string; leftBar: string; labelColor: string; badge?: { text: string; bg: string };
}> = {
  complete: { border: "#bbf7d0", bg: "#f0fdf4", leftBar: "#059669", labelColor: "#065f46" },
  current: { border: "#bfdbfe", bg: "#eff6ff", leftBar: "#2563eb", labelColor: "#1e40af" },
  pending: { border: "#e2e8f0", bg: "#f8fafc", leftBar: "transparent", labelColor: "#475569" },
  missing: { border: "#fecaca", bg: "#fef2f2", leftBar: "#dc2626", labelColor: "#991b1b", badge: { text: "GAP", bg: "#dc2626" } },
};

export const FlowDiagramVisual = forwardRef<HTMLDivElement, Props>(
  ({ data, title, caption, insight }, ref) => {
    const { steps, direction = "horizontal" } = data;
    const isHorizontal = direction === "horizontal";

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
          <div style={{ width: 3, height: 22, backgroundColor: "#0ea5e9", borderRadius: 2, marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em", lineHeight: 1.3 }}>{title}</div>
            {caption && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3, fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", fontStyle: "italic" }}>{caption}</div>}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: isHorizontal ? "row" : "column",
            alignItems: "stretch",
            flexWrap: "wrap",
            gap: 0,
            margin: "20px 0 8px",
          }}
        >
          {steps.map((step, i) => {
            const styles = STATUS_STYLES[step.status || "pending"];
            return (
              <div key={i} style={{
                display: "flex",
                flexDirection: isHorizontal ? "row" : "column",
                alignItems: "center",
                flex: isHorizontal ? "1 1 0" : undefined,
                minWidth: 0,
              }}>
                <div
                  style={{
                    position: "relative",
                    border: `1px solid ${styles.border}`,
                    borderLeft: styles.leftBar !== "transparent" ? `3px solid ${styles.leftBar}` : `1px solid ${styles.border}`,
                    borderRadius: 8,
                    padding: "14px 16px",
                    backgroundColor: styles.bg,
                    width: isHorizontal ? "100%" : undefined,
                    minWidth: isHorizontal ? undefined : 160,
                    flex: isHorizontal ? 1 : undefined,
                  }}
                >
                  {step.icon && <div style={{ fontSize: 16, marginBottom: 4 }}>{step.icon}</div>}

                  {/* Step number */}
                  <div style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: "#94a3b8",
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                  }}>
                    STEP {i + 1}
                  </div>

                  <div style={{
                    fontWeight: 600,
                    fontSize: 12,
                    color: styles.labelColor,
                    lineHeight: 1.3,
                    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                  }}>
                    {step.label}
                  </div>

                  {step.sublabel && (
                    <div style={{
                      fontSize: 11,
                      color: "#64748b",
                      marginTop: 4,
                      lineHeight: 1.4,
                      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                    }}>
                      {step.sublabel}
                    </div>
                  )}

                  {styles.badge && (
                    <div
                      style={{
                        position: "absolute",
                        top: -7,
                        right: 10,
                        backgroundColor: styles.badge.bg,
                        color: "#ffffff",
                        fontSize: 8,
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 10,
                        letterSpacing: "0.08em",
                        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                      }}
                    >
                      {styles.badge.text}
                    </div>
                  )}
                </div>

                {/* Connector */}
                {i < steps.length - 1 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: isHorizontal ? "0 2px" : "2px 0",
                      flexShrink: 0,
                    }}
                  >
                    <svg width={isHorizontal ? 20 : 12} height={isHorizontal ? 12 : 20} style={{ display: "block" }}>
                      {isHorizontal ? (
                        <path d="M 2 6 L 16 6 L 12 2 M 16 6 L 12 10" fill="none" stroke="#94a3b8" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                      ) : (
                        <path d="M 6 2 L 6 16 L 2 12 M 6 16 L 10 12" fill="none" stroke="#94a3b8" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                      )}
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
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

FlowDiagramVisual.displayName = "FlowDiagramVisual";
