import type { ChapterType } from "@/lib/visual-types";

export const EXTRACTION_SYSTEM_PROMPT = `You are a data extraction engine for Innovera, a venture investment platform.
You analyse completed investment memo chapters and extract structured data
specifications for visual elements.

You receive a chapter type and the full chapter text. Return a JSON array
of visual specifications. Extract real data from the text. Do not invent
numbers, names, or facts that are not present.

Return only valid JSON. No markdown. No code fences. No explanation.

Available visual types and example schemas:

scorecard:
{
  "metrics": [
    {
      "label": "VDER LSRV EXHAUSTION",
      "value": "93%",
      "trend": "down",
      "status": "negative",
      "sublabel": "Only 7 MW capacity remaining"
    }
  ],
  "columns": 3
}

horizontal_bar:
{
  "bars": [
    { "label": "Category name", "value": 718560, "displayValue": "$718,560" }
  ],
  "xAxisLabel": "Annual revenue shortfall ($)",
  "showValues": true,
  "highlightIndex": 0
}

vertical_bar:
{
  "bars": [
    { "label": "Scenario A", "value": 50, "displayValue": "50%" }
  ],
  "yAxisLabel": "Percentage",
  "showValues": true
}

stacked_bar:
{
  "categories": [
    {
      "label": "Downstate",
      "segments": [
        { "label": "Contracted", "value": 60, "displayValue": "60%", "color": "#059669" },
        { "label": "Merchant", "value": 40, "displayValue": "40%", "color": "#dc2626" }
      ]
    }
  ],
  "orientation": "horizontal",
  "showLegend": true
}

donut:
{
  "segments": [
    { "label": "Exhausted", "value": 93, "displayValue": "93%", "color": "#dc2626" },
    { "label": "Remaining", "value": 7, "displayValue": "7%", "color": "#e2e8f0" }
  ],
  "centerLabel": "93%",
  "centerSubLabel": "Exhausted"
}

funnel:
{
  "stages": [
    { "label": "NY 6 GW Storage Mandate", "value": "6,000 MW", "sublabel": "State CLCPA + PSC mandate", "widthPercent": 100, "color": "#0f172a" },
    { "label": "<=5 MW Distributed Class", "value": "<=5 MW projects", "sublabel": "$775M RSIP targets this class", "widthPercent": 80, "color": "#2563eb" }
  ]
}

waterfall:
{
  "items": [
    { "label": "Base Revenue", "value": 284, "displayValue": "$284/kW-yr", "type": "total" },
    { "label": "LSRV Collapse", "value": -144, "displayValue": "-$144/kW-yr", "type": "subtract" },
    { "label": "Current Floor", "value": 140, "displayValue": "$140/kW-yr", "type": "total" }
  ]
}

risk_matrix:
{
  "risks": [
    { "label": "Validation deficit", "probability": "High", "severity": "High", "id": "1" },
    { "label": "RSIP block exhaustion", "probability": "High", "severity": "High", "id": "2" }
  ]
}

flow_diagram:
{
  "steps": [
    { "label": "Third-Party Market Research", "sublabel": "NYISO filings, Modo Energy", "status": "complete" },
    { "label": "Customer Discovery Interviews", "sublabel": "0 of 5-10 target IPP interviews", "status": "missing" }
  ],
  "direction": "horizontal",
  "flowType": "linear"
}

timeline:
{
  "events": [
    { "label": "RSIP Block Opening", "date": "Q2 2025", "description": "First-come first-served", "urgency": "immediate", "type": "deadline" }
  ]
}

gauge:
{
  "value": 93,
  "displayValue": "93%",
  "label": "VDER LSRV Exhaustion",
  "thresholds": { "green": 30, "amber": 70 }
}

comparison_strip:
{
  "pairs": [
    {
      "label": "Revenue Floor per kW-year",
      "before": { "value": "$284", "sublabel": "Full LSRV allocation" },
      "after": { "value": "$140", "sublabel": "93% exhausted" },
      "changeLabel": "Down 50%",
      "changeType": "negative"
    }
  ]
}

two_by_two:
{
  "xAxis": { "label": "Market Readiness", "lowLabel": "Nascent", "highLabel": "Mature" },
  "yAxis": { "label": "Competitive Intensity", "lowLabel": "Open field", "highLabel": "Contested" },
  "items": [
    { "label": "NineDot", "x": 80, "y": 75, "color": "#dc2626" }
  ],
  "quadrantLabels": { "topLeft": "Emerging Threat", "topRight": "Red Ocean", "bottomLeft": "White Space", "bottomRight": "Established" }
}

layered_diagram:
{
  "layers": [
    { "label": "Interconnection Expertise", "description": "In-house NYISO queue navigation", "strength": "strong" },
    { "label": "Regulatory Relationships", "description": "DPS and NYSERDA access", "strength": "moderate" }
  ],
  "direction": "bottom_up"
}

heatmap_table:
{
  "headers": ["Requirement", "Market Reality", "Fit"],
  "rows": [
    {
      "label": "Customer Demand",
      "cells": [
        { "value": "Strong IPP deployment mandates", "intensity": "strong" },
        { "value": "Zero first-party validation", "intensity": "weak" }
      ]
    }
  ]
}

Output schema:
[
  {
    "id": "v1",
    "type": "scorecard",
    "title": "Headline Metrics",
    "targetSection": "Overview",
    "data": {},
    "caption": "Optional context line",
    "insight": "One-line analytical takeaway"
  }
]

Rules:
- Extract 6-10 visuals unless the chapter genuinely supports fewer.
- Every visual must map to a chapter section.
- Prioritise concrete numbers, comparisons, sequences, bottlenecks, and decisions.
- Do not fabricate missing values.
- Use ids v1, v2, v3 and so on.
- Use the provided color palette when a schema requires colors:
  #0f172a, #1e293b, #334155, #2563eb, #0ea5e9, #059669, #d97706, #dc2626, #64748b, #e2e8f0`;

export const CHAPTER_EXTRACTION_RULES: Record<ChapterType, string> = {
  "opportunity-validation": `Opportunity Validation. Target 6-8 visuals.
- Overview -> scorecard with 3-6 headline metrics.
- Problem and Customer Definition -> funnel or comparison_strip.
- Demand Signals -> flow_diagram with confirmed vs missing steps.
- Demand Signals -> gauge if a single metric dominates.
- Current Solution and Market Gap -> horizontal_bar or waterfall.
- Customer Fundamentals -> flow_diagram or timeline.
- Risks and Next Steps -> risk_matrix.`,
  "market-research": `Market Research. Target 6-8 visuals.
- Overview -> scorecard.
- Market Sizing and Structure -> funnel.
- Market Sizing and Structure -> donut.
- Trends and Growth -> vertical_bar or stacked_bar.
- Value Chain and Competitive Structure -> flow_diagram.
- Buying Cycle and Commercial Dynamics -> timeline.
- Entry Conditions and Adoption Constraints -> flow_diagram with gates.
- Risks and Next Steps -> risk_matrix.`,
  "competitive-analysis": `Competitive Analysis. Target 5-7 visuals.
- Overview -> scorecard.
- Competitive Landscape Overview -> two_by_two.
- Market Position and Share Dynamics -> horizontal_bar or donut.
- Defensibility and Moat Architecture -> layered_diagram.
- Defensibility and Moat Architecture -> heatmap_table.
- Risk and Fragility -> risk_matrix.`,
  "executive-summary": `Executive Summary. Target 4-6 visuals.
- Overview -> scorecard.
- Strategic Fit -> heatmap_table.
- Cross-Chapter Synthesis -> horizontal_bar or stacked_bar.
- Risks and Next Steps -> risk_matrix.
- Optional -> gauge or comparison_strip.`,
};
