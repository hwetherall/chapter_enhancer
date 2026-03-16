export type VisualType =
  | "horizontal_bar"
  | "vertical_bar"
  | "stacked_bar"
  | "donut"
  | "funnel"
  | "waterfall"
  | "risk_matrix"
  | "flow_diagram"
  | "timeline"
  | "gauge"
  | "comparison_strip"
  | "two_by_two"
  | "layered_diagram"
  | "scorecard"
  | "heatmap_table";

export interface VisualSpec {
  id: string;
  type: VisualType;
  title: string;
  targetSection: string;
  data: Record<string, unknown>;
  caption?: string;
  insight?: string;
}

// Data schemas for each visual type

export interface HorizontalBarData {
  bars: Array<{
    label: string;
    value: number;
    displayValue: string;
    color?: string;
  }>;
  xAxisLabel?: string;
  showValues: boolean;
  maxValue?: number;
  highlightIndex?: number;
}

export interface VerticalBarData {
  bars: Array<{
    label: string;
    value: number;
    displayValue: string;
    color?: string;
  }>;
  yAxisLabel?: string;
  showValues: boolean;
  groupLabel?: string;
}

export interface StackedBarData {
  categories: Array<{
    label: string;
    segments: Array<{
      label: string;
      value: number;
      displayValue: string;
      color: string;
    }>;
  }>;
  orientation: "horizontal" | "vertical";
  showLegend: boolean;
}

export interface DonutData {
  segments: Array<{
    label: string;
    value: number;
    displayValue: string;
    color: string;
  }>;
  centerLabel: string;
  centerSubLabel?: string;
  size?: number;
}

export interface FunnelData {
  stages: Array<{
    label: string;
    value: string;
    sublabel?: string;
    widthPercent: number;
    color: string;
  }>;
  title?: string;
}

export interface WaterfallData {
  items: Array<{
    label: string;
    value: number;
    displayValue: string;
    type: "add" | "subtract" | "total";
  }>;
  startLabel?: string;
  endLabel?: string;
}

export interface RiskMatrixData {
  risks: Array<{
    label: string;
    probability: "Low" | "Medium" | "High";
    severity: "Low" | "Medium" | "High";
    id: string;
  }>;
}

export interface FlowDiagramData {
  steps: Array<{
    label: string;
    sublabel?: string;
    status?: "complete" | "current" | "pending" | "missing";
    icon?: string;
  }>;
  direction: "horizontal" | "vertical";
  connectorLabel?: string;
  flowType: "linear" | "branching";
}

export interface TimelineData {
  events: Array<{
    label: string;
    date: string;
    description?: string;
    urgency: "immediate" | "near_term" | "medium_term" | "long_term";
    type?: "milestone" | "deadline" | "window" | "risk";
  }>;
  title?: string;
}

export interface GaugeData {
  value: number;
  displayValue: string;
  label: string;
  thresholds: {
    green: number;
    amber: number;
  };
  size?: number;
}

export interface ComparisonStripData {
  pairs: Array<{
    label: string;
    before: { value: string; sublabel?: string };
    after: { value: string; sublabel?: string };
    changeLabel?: string;
    changeType: "positive" | "negative" | "neutral";
  }>;
}

export interface TwoByTwoData {
  xAxis: { label: string; lowLabel: string; highLabel: string };
  yAxis: { label: string; lowLabel: string; highLabel: string };
  items: Array<{
    label: string;
    x: number;
    y: number;
    size?: number;
    color?: string;
  }>;
  quadrantLabels?: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
  };
}

export interface LayeredDiagramData {
  layers: Array<{
    label: string;
    description: string;
    strength: "strong" | "moderate" | "weak";
  }>;
  direction: "bottom_up" | "top_down";
  title?: string;
}

export interface ScorecardData {
  metrics: Array<{
    label: string;
    value: string;
    trend?: "up" | "down" | "flat";
    status: "positive" | "warning" | "negative" | "neutral";
    sublabel?: string;
  }>;
  columns?: number;
}

export interface HeatmapTableData {
  headers: string[];
  rows: Array<{
    label: string;
    cells: Array<{
      value: string;
      intensity: "strong" | "moderate" | "weak" | "none";
    }>;
  }>;
}
