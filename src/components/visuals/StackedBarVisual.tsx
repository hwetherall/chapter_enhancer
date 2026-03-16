import { forwardRef } from "react";
import type { StackedBarData } from "@/lib/visual-types";

interface Props {
  data: StackedBarData;
  title: string;
  caption?: string;
  insight?: string;
}

export const StackedBarVisual = forwardRef<HTMLDivElement, Props>(
  ({ data, title, caption, insight }, ref) => {
    const { categories, orientation = "horizontal", showLegend = true } = data;

    // Collect unique legend items
    const legendItems: Array<{ label: string; color: string }> = [];
    const seen = new Set<string>();
    categories.forEach((cat) => {
      cat.segments.forEach((seg) => {
        if (!seen.has(seg.label)) {
          seen.add(seg.label);
          legendItems.push({ label: seg.label, color: seg.color });
        }
      });
    });

    if (orientation === "horizontal") {
      const barHeight = 36;
      const gap = 18;
      const labelWidth = 160;
      const chartWidth = 520;
      const svgHeight = categories.length * (barHeight + gap) + 24;

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

          <svg viewBox={`0 0 720 ${svgHeight}`} width="100%" style={{ display: "block", marginTop: 16 }}>
            {/* Baseline */}
            <line x1={labelWidth} y1={8} x2={labelWidth} y2={svgHeight - 12} stroke="#e2e8f0" strokeWidth={1} />

            {categories.map((cat, ci) => {
              const y = 12 + ci * (barHeight + gap);
              const total = cat.segments.reduce((s, seg) => s + seg.value, 0);
              let xOffset = labelWidth;

              return (
                <g key={ci}>
                  <text
                    x={labelWidth - 12}
                    y={y + barHeight / 2}
                    textAnchor="end"
                    dominantBaseline="middle"
                    style={{
                      fontSize: 11,
                      fill: "#475569",
                      fontWeight: 500,
                      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {cat.label}
                  </text>
                  {cat.segments.map((seg, si) => {
                    const w = total > 0 ? (seg.value / total) * chartWidth : 0;
                    const x = xOffset;
                    xOffset += w;
                    const isFirst = si === 0;
                    const isLast = si === cat.segments.length - 1;
                    return (
                      <g key={si}>
                        <rect
                          x={x}
                          y={y}
                          width={Math.max(0, w)}
                          height={barHeight}
                          fill={seg.color}
                          rx={isFirst && isLast ? 3 : isFirst ? "3 0 0 3" as unknown as number : isLast ? "0 3 3 0" as unknown as number : 0}
                        />
                        {/* Inner label if wide enough */}
                        {w > 60 && (
                          <text
                            x={x + w / 2}
                            y={y + barHeight / 2 + 1}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              fill: "#ffffff",
                              fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                            }}
                          >
                            {seg.displayValue}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>

          {showLegend && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 12, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
              {legendItems.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: item.color, boxShadow: `0 0 0 3px ${item.color}18` }} />
                  <span style={{ fontSize: 10, color: "#64748b", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>{item.label}</span>
                </div>
              ))}
            </div>
          )}

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

    // Vertical orientation
    const barW = Math.min(56, 600 / categories.length - 20);
    const chartH = 300;
    const chartTop = 20;
    const chartLeft = 56;
    const chartRight = 20;
    const svgWidth = 720;
    const maxTotal = Math.max(...categories.map((c) => c.segments.reduce((s, seg) => s + seg.value, 0)));
    const svgHeight = chartH + 80;

    // Gridlines
    const gridCount = 4;
    const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
      const val = (maxTotal / gridCount) * i;
      const y = chartTop + chartH - (val / maxTotal) * chartH;
      return { val, y };
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

        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" style={{ display: "block", marginTop: 16 }}>
          {/* Gridlines */}
          {gridLines.map((g, i) => (
            <g key={i}>
              <line x1={chartLeft} y1={g.y} x2={svgWidth - chartRight} y2={g.y} stroke={i === 0 ? "#e2e8f0" : "#f1f5f9"} strokeWidth={1} />
              {i > 0 && (
                <text
                  x={chartLeft - 8}
                  y={g.y + 1}
                  textAnchor="end"
                  dominantBaseline="middle"
                  style={{ fontSize: 9, fill: "#cbd5e1", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}
                >
                  {Math.round(g.val).toLocaleString()}
                </text>
              )}
            </g>
          ))}

          {categories.map((cat, ci) => {
            const totalGap = (svgWidth - chartLeft - chartRight) - barW * categories.length;
            const gapSize = totalGap / (categories.length + 1);
            const x = chartLeft + gapSize + ci * (barW + gapSize);
            let yOffset = chartTop + chartH;

            return (
              <g key={ci}>
                {cat.segments.map((seg, si) => {
                  const h = maxTotal > 0 ? (seg.value / maxTotal) * chartH : 0;
                  yOffset -= h;
                  const isTop = si === cat.segments.length - 1;
                  return (
                    <rect
                      key={si}
                      x={x}
                      y={yOffset}
                      width={barW}
                      height={h}
                      fill={seg.color}
                      rx={isTop ? 3 : 0}
                    />
                  );
                })}
                <text
                  x={x + barW / 2}
                  y={chartTop + chartH + 18}
                  textAnchor="middle"
                  style={{ fontSize: 10, fill: "#64748b", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}
                >
                  {cat.label}
                </text>
              </g>
            );
          })}
        </svg>

        {showLegend && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 12, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
            {legendItems.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: item.color, boxShadow: `0 0 0 3px ${item.color}18` }} />
                <span style={{ fontSize: 10, color: "#64748b", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>{item.label}</span>
              </div>
            ))}
          </div>
        )}

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

StackedBarVisual.displayName = "StackedBarVisual";
