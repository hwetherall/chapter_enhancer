import { forwardRef } from "react";
import type { HeatmapTableData } from "@/lib/visual-types";

interface Props {
  data: HeatmapTableData;
  title: string;
  caption?: string;
  insight?: string;
}

const INTENSITY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  strong: { bg: "#dcfce7", text: "#166534", dot: "#059669" },
  moderate: { bg: "#fef9c3", text: "#854d0e", dot: "#d97706" },
  weak: { bg: "#fee2e2", text: "#991b1b", dot: "#dc2626" },
  none: { bg: "#f8fafc", text: "#94a3b8", dot: "#cbd5e1" },
};

export const HeatmapTableVisual = forwardRef<HTMLDivElement, Props>(
  ({ data, title, caption, insight }, ref) => {
    const { headers, rows } = data;

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

        <div style={{ marginTop: 16, borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    backgroundColor: "#0f172a",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 9,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    padding: "14px 18px",
                    textAlign: "left",
                    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                  }}
                />
                {headers.map((h, i) => (
                  <th
                    key={i}
                    style={{
                      backgroundColor: "#0f172a",
                      color: "#ffffff",
                      fontSize: 9,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      padding: "14px 16px",
                      textAlign: "center",
                      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                      minWidth: 90,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  <td
                    style={{
                      padding: "14px 18px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#1e293b",
                      borderBottom: "1px solid #f1f5f9",
                      backgroundColor: "#ffffff",
                      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                      lineHeight: 1.3,
                    }}
                  >
                    {row.label}
                  </td>
                  {row.cells.map((cell, ci) => {
                    const styles = INTENSITY_STYLES[cell.intensity] || INTENSITY_STYLES.none;
                    return (
                      <td
                        key={ci}
                        style={{
                          padding: "12px 16px",
                          fontSize: 12,
                          fontWeight: 600,
                          color: styles.text,
                          backgroundColor: styles.bg,
                          borderBottom: "1px solid rgba(0,0,0,0.04)",
                          textAlign: "center",
                          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                          lineHeight: 1.3,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: styles.dot, flexShrink: 0 }} />
                          {cell.value}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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

HeatmapTableVisual.displayName = "HeatmapTableVisual";
