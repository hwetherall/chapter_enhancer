import { forwardRef } from "react";
import type { LayeredDiagramData } from "@/lib/visual-types";

interface Props {
  data: LayeredDiagramData;
  title: string;
  caption?: string;
  insight?: string;
}

const STRENGTH_STYLES: Record<string, { bg: string; border: string; text: string; label: string; badge: string }> = {
  strong: { bg: "#1a1f36", border: "#1a1f36", text: "#ffffff", label: "rgba(255,255,255,0.6)", badge: "STRONG" },
  moderate: { bg: "#2563eb", border: "#2563eb", text: "#ffffff", label: "rgba(255,255,255,0.6)", badge: "MODERATE" },
  weak: { bg: "#ffffff", border: "#cbd5e1", text: "#475569", label: "#94a3b8", badge: "WEAK" },
};

export const LayeredDiagramVisual = forwardRef<HTMLDivElement, Props>(
  ({ data, title, caption, insight }, ref) => {
    const { layers, direction = "bottom_up" } = data;
    const orderedLayers = direction === "bottom_up" ? [...layers].reverse() : layers;
    const totalLayers = layers.length;

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
          <div style={{ width: 3, height: 22, backgroundColor: "#1a1f36", borderRadius: 2, marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em", lineHeight: 1.3 }}>{title}</div>
            {caption && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3, fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", fontStyle: "italic" }}>{caption}</div>}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, marginTop: 24 }}>
          {orderedLayers.map((layer, i) => {
            const styles = STRENGTH_STYLES[layer.strength] || STRENGTH_STYLES.weak;
            const layerIndex = direction === "bottom_up" ? totalLayers - 1 - i : i;
            const widthPct = 100 - layerIndex * (35 / totalLayers);
            const isWeak = layer.strength === "weak";

            return (
              <div
                key={i}
                style={{
                  width: `${widthPct}%`,
                  minHeight: 76,
                  backgroundColor: styles.bg,
                  border: isWeak ? `2px dashed ${styles.border}` : "none",
                  borderRadius: i === 0 ? "10px 10px 4px 4px" : i === orderedLayers.length - 1 ? "4px 4px 10px 10px" : 4,
                  padding: "16px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  boxShadow: !isWeak ? "0 1px 2px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.08)" : undefined,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: styles.text,
                    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                    letterSpacing: "-0.01em",
                  }}>
                    {layer.label}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: styles.label,
                    marginTop: 3,
                    lineHeight: 1.4,
                    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                  }}>
                    {layer.description}
                  </div>
                </div>

                {/* Strength badge */}
                <div style={{
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: isWeak ? "#94a3b8" : "rgba(255,255,255,0.5)",
                  backgroundColor: isWeak ? "#f1f5f9" : "rgba(255,255,255,0.1)",
                  padding: "3px 8px",
                  borderRadius: 4,
                  flexShrink: 0,
                  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                }}>
                  {styles.badge}
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

LayeredDiagramVisual.displayName = "LayeredDiagramVisual";
