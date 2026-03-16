import { forwardRef } from "react";
import type { ComparisonStripData } from "@/lib/visual-types";

interface Props {
  data: ComparisonStripData;
  title: string;
  caption?: string;
  insight?: string;
}

const CHANGE_STYLES: Record<string, { accent: string; bg: string; badgeBg: string }> = {
  positive: { accent: "#059669", bg: "#f0fdf4", badgeBg: "#dcfce7" },
  negative: { accent: "#dc2626", bg: "#fef2f2", badgeBg: "#fee2e2" },
  neutral: { accent: "#2563eb", bg: "#eff6ff", badgeBg: "#dbeafe" },
};

export const ComparisonStripVisual = forwardRef<HTMLDivElement, Props>(
  ({ data, title, caption, insight }, ref) => {
    const { pairs } = data;

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

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
          {pairs.map((pair, i) => {
            const styles = CHANGE_STYLES[pair.changeType] || CHANGE_STYLES.neutral;
            return (
              <div key={i}>
                <div style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#94a3b8",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                }}>
                  {pair.label}
                </div>
                <div style={{ display: "flex", alignItems: "stretch", gap: 0, borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                  {/* Before */}
                  <div style={{
                    flex: 1,
                    backgroundColor: "#f8fafc",
                    padding: "16px 20px",
                  }}>
                    <div style={{
                      fontSize: 8,
                      fontWeight: 600,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: 4,
                      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                    }}>
                      Before
                    </div>
                    <div style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: "#475569",
                      letterSpacing: "-0.02em",
                      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                    }}>
                      {pair.before.value}
                    </div>
                    {pair.before.sublabel && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>{pair.before.sublabel}</div>}
                  </div>

                  {/* Change badge — vertical center strip */}
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: styles.badgeBg,
                    padding: "8px 14px",
                    minWidth: 60,
                  }}>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: styles.accent,
                      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                    }}>
                      {pair.changeLabel || "→"}
                    </div>
                  </div>

                  {/* After */}
                  <div style={{
                    flex: 1,
                    backgroundColor: styles.bg,
                    padding: "16px 20px",
                  }}>
                    <div style={{
                      fontSize: 8,
                      fontWeight: 600,
                      color: styles.accent,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: 4,
                      opacity: 0.7,
                      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                    }}>
                      After
                    </div>
                    <div style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: styles.accent,
                      letterSpacing: "-0.02em",
                      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                    }}>
                      {pair.after.value}
                    </div>
                    {pair.after.sublabel && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>{pair.after.sublabel}</div>}
                  </div>
                </div>
              </div>
            );
          })}
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

ComparisonStripVisual.displayName = "ComparisonStripVisual";
