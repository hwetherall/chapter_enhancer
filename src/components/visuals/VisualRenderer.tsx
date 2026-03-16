import { forwardRef } from "react";
import type { VisualSpec } from "@/lib/visual-types";
import { HorizontalBarVisual } from "./HorizontalBarVisual";
import { VerticalBarVisual } from "./VerticalBarVisual";
import { StackedBarVisual } from "./StackedBarVisual";
import { DonutVisual } from "./DonutVisual";
import { FunnelVisual } from "./FunnelVisual";
import { WaterfallVisual } from "./WaterfallVisual";
import { RiskMatrixVisual } from "./RiskMatrixVisual";
import { FlowDiagramVisual } from "./FlowDiagramVisual";
import { TimelineVisual } from "./TimelineVisual";
import { GaugeVisual } from "./GaugeVisual";
import { ComparisonStripVisual } from "./ComparisonStripVisual";
import { TwoByTwoVisual } from "./TwoByTwoVisual";
import { LayeredDiagramVisual } from "./LayeredDiagramVisual";
import { ScorecardVisual } from "./ScorecardVisual";
import { HeatmapTableVisual } from "./HeatmapTableVisual";

interface Props {
  spec: VisualSpec;
}

export const VisualRenderer = forwardRef<HTMLDivElement, Props>(({ spec }, ref) => {
  const commonProps = {
    title: spec.title,
    caption: spec.caption,
    insight: spec.insight,
    ref,
  };

  switch (spec.type) {
    case "horizontal_bar":
      return <HorizontalBarVisual data={spec.data as never} {...commonProps} />;
    case "vertical_bar":
      return <VerticalBarVisual data={spec.data as never} {...commonProps} />;
    case "stacked_bar":
      return <StackedBarVisual data={spec.data as never} {...commonProps} />;
    case "donut":
      return <DonutVisual data={spec.data as never} {...commonProps} />;
    case "funnel":
      return <FunnelVisual data={spec.data as never} {...commonProps} />;
    case "waterfall":
      return <WaterfallVisual data={spec.data as never} {...commonProps} />;
    case "risk_matrix":
      return <RiskMatrixVisual data={spec.data as never} {...commonProps} />;
    case "flow_diagram":
      return <FlowDiagramVisual data={spec.data as never} {...commonProps} />;
    case "timeline":
      return <TimelineVisual data={spec.data as never} {...commonProps} />;
    case "gauge":
      return <GaugeVisual data={spec.data as never} {...commonProps} />;
    case "comparison_strip":
      return <ComparisonStripVisual data={spec.data as never} {...commonProps} />;
    case "two_by_two":
      return <TwoByTwoVisual data={spec.data as never} {...commonProps} />;
    case "layered_diagram":
      return <LayeredDiagramVisual data={spec.data as never} {...commonProps} />;
    case "scorecard":
      return <ScorecardVisual data={spec.data as never} {...commonProps} />;
    case "heatmap_table":
      return <HeatmapTableVisual data={spec.data as never} {...commonProps} />;
    default:
      return (
        <div ref={ref} style={{ padding: 24, color: "#dc2626", fontFamily: "system-ui, sans-serif" }}>
          Unknown visual type: {spec.type}
        </div>
      );
  }
});

VisualRenderer.displayName = "VisualRenderer";
