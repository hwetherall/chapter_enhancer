import { forwardRef } from "react";
import type { TimelineData } from "@/lib/visual-types";

interface Props {
  data: TimelineData;
  title: string;
  caption?: string;
  insight?: string;
}

const URGENCY_COLORS: Record<string, { fill: string; bg: string }> = {
  immediate: { fill: "#dc2626", bg: "#fef2f2" },
  near_term: { fill: "#d97706", bg: "#fffbeb" },
  medium_term: { fill: "#2563eb", bg: "#eff6ff" },
  long_term: { fill: "#64748b", bg: "#f8fafc" },
};

export const TimelineVisual = forwardRef<HTMLDivElement, Props>(
  ({ data, title, caption, insight }, ref) => {
    const { events } = data;

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

        {/* Vertical timeline — more editorial than horizontal */}
        <div style={{ marginTop: 24, paddingLeft: 24, position: "relative" }}>
          {/* Vertical line */}
          <div style={{
            position: "absolute",
            left: 24,
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: "#e2e8f0",
            borderRadius: 1,
          }} />

          {events.map((event, i) => {
            const colors = URGENCY_COLORS[event.urgency] || URGENCY_COLORS.long_term;
            return (
              <div key={i} style={{
                display: "flex",
                gap: 20,
                marginBottom: i < events.length - 1 ? 24 : 0,
                position: "relative",
              }}>
                {/* Dot on the timeline */}
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: colors.fill,
                  border: "2px solid #ffffff",
                  boxShadow: `0 0 0 3px ${colors.fill}25`,
                  flexShrink: 0,
                  marginTop: 4,
                  position: "relative",
                  zIndex: 1,
                }} />

                {/* Content card */}
                <div style={{
                  flex: 1,
                  backgroundColor: colors.bg,
                  borderRadius: 8,
                  padding: "12px 16px",
                  border: `1px solid ${colors.fill}20`,
                }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: event.description ? 4 : 0 }}>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#0f172a",
                      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                      lineHeight: 1.3,
                    }}>
                      {event.label}
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: colors.fill,
                      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                      whiteSpace: "nowrap",
                    }}>
                      {event.date}
                    </span>
                  </div>
                  {event.description && (
                    <div style={{
                      fontSize: 11,
                      color: "#64748b",
                      lineHeight: 1.4,
                      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                    }}>
                      {event.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginTop: 20, paddingTop: 12, borderTop: "1px solid #f1f5f9", justifyContent: "flex-start" }}>
          {Object.entries(URGENCY_COLORS).map(([key, colors]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: colors.fill }} />
              <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</span>
            </div>
          ))}
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

TimelineVisual.displayName = "TimelineVisual";
