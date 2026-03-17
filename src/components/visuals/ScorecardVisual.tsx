import { forwardRef } from "react";
import { VISUAL_CANVAS_WIDTH, VISUAL_COLORS, VISUAL_FONT_FAMILY, VISUAL_WRAPPER_PADDING } from "@/lib/design-system";
import type { ScorecardData } from "@/lib/visual-types";

interface Props {
  data: ScorecardData;
  title: string;
  caption?: string;
  insight?: string;
}

const STATUS_ACCENT: Record<ScorecardData["metrics"][number]["status"], string> = {
  positive: VISUAL_COLORS.green,
  warning: VISUAL_COLORS.amber,
  negative: VISUAL_COLORS.red,
  neutral: VISUAL_COLORS.grey,
};

const TREND_CHAR: Record<NonNullable<ScorecardData["metrics"][number]["trend"]>, string> = {
  up: "\u25B2",
  down: "\u25BC",
  flat: "-",
};

export const ScorecardVisual = forwardRef<HTMLDivElement, Props>(
  ({ data, title, caption, insight }, ref) => {
    const { metrics, columns = 4 } = data;
    const heroColumns = Math.min(Math.max(columns, 1), 4);
    const heroMetrics = metrics.slice(0, heroColumns);
    const supportMetrics = metrics.slice(heroColumns);

    return (
      <div
        ref={ref}
        style={{
          fontFamily: VISUAL_FONT_FAMILY,
          maxWidth: VISUAL_CANVAS_WIDTH,
          padding: VISUAL_WRAPPER_PADDING,
          backgroundColor: VISUAL_COLORS.white,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div
            style={{
              width: 3,
              minHeight: 28,
              borderRadius: 999,
              backgroundColor: VISUAL_COLORS.blue,
              flexShrink: 0,
              marginTop: 2,
            }}
          />
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: VISUAL_COLORS.navy,
                lineHeight: 1.35,
              }}
            >
              {title}
            </div>
            {caption ? (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: VISUAL_COLORS.greyLight,
                  fontStyle: "italic",
                  lineHeight: 1.4,
                }}
              >
                {caption}
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${heroMetrics.length || 1}, minmax(0, 1fr))`,
            marginTop: 24,
            backgroundColor: VISUAL_COLORS.navy,
            borderRadius: supportMetrics.length > 0 ? "12px 12px 0 0" : 12,
            overflow: "hidden",
          }}
        >
          {heroMetrics.map((metric, index) => {
            const accentColor = STATUS_ACCENT[metric.status];
            const trend = metric.trend ? TREND_CHAR[metric.trend] : null;

            return (
              <div
                key={`${metric.label}-${index}`}
                style={{
                  padding: "22px 20px 18px",
                  borderRight:
                    index < heroMetrics.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: accentColor,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.55)",
                    }}
                  >
                    {metric.label}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 30,
                      fontWeight: 700,
                      lineHeight: 1,
                      color: VISUAL_COLORS.white,
                    }}
                  >
                    {metric.value}
                  </span>
                  {trend ? (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: accentColor,
                      }}
                    >
                      {trend}
                    </span>
                  ) : null}
                </div>

                {metric.sublabel ? (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 11,
                      lineHeight: 1.35,
                      color: "rgba(255,255,255,0.45)",
                    }}
                  >
                    {metric.sublabel}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {supportMetrics.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(heroColumns, supportMetrics.length)}, minmax(0, 1fr))`,
              backgroundColor: VISUAL_COLORS.card,
              border: `1px solid ${VISUAL_COLORS.border}`,
              borderTop: "none",
              borderRadius: "0 0 12px 12px",
              overflow: "hidden",
            }}
          >
            {supportMetrics.map((metric, index) => {
              const accentColor = STATUS_ACCENT[metric.status];
              const trend = metric.trend ? TREND_CHAR[metric.trend] : null;
              const columnsInRow = Math.min(heroColumns, supportMetrics.length);

              return (
                <div
                  key={`${metric.label}-${index}`}
                  style={{
                    padding: "18px 20px 16px",
                    borderRight: index < columnsInRow - 1 ? `1px solid ${VISUAL_COLORS.border}` : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: accentColor,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: VISUAL_COLORS.greyLight,
                      }}
                    >
                      {metric.label}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        lineHeight: 1,
                        color: VISUAL_COLORS.navy,
                      }}
                    >
                      {metric.value}
                    </span>
                    {trend ? (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: accentColor,
                        }}
                      >
                        {trend}
                      </span>
                    ) : null}
                  </div>

                  {metric.sublabel ? (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 11,
                        lineHeight: 1.35,
                        color: VISUAL_COLORS.greyLight,
                      }}
                    >
                      {metric.sublabel}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {insight ? (
          <div
            style={{
              marginTop: 16,
              paddingTop: 12,
              borderTop: `1px solid ${VISUAL_COLORS.panel}`,
              color: VISUAL_COLORS.grey,
              lineHeight: 1.5,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: VISUAL_COLORS.textSecondary,
              }}
            >
              Insight
            </div>
            <div style={{ marginTop: 4, fontSize: 12 }}>{insight}</div>
          </div>
        ) : null}
      </div>
    );
  }
);

ScorecardVisual.displayName = "ScorecardVisual";
