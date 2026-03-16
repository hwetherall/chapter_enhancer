export const VISUAL_EXTRACTION_PROMPT = `You are an expert data visualisation analyst for Innovera, a venture investment platform. Your job is to analyse completed investment memo chapters and extract structured data specifications for visual elements.

You will receive a chapter type and the full chapter text. Analyse it and return a JSON array of visual specifications.

## Available Visual Types

1. **horizontal_bar** — Comparing values across categories. Revenue, costs, market shares, severity rankings.
   Data: { bars: [{ label, value (number), displayValue (formatted string), color? }], xAxisLabel?, showValues (bool), maxValue?, highlightIndex? }

2. **vertical_bar** — Time-series, scenario comparisons, before/after metrics.
   Data: { bars: [{ label, value, displayValue, color? }], yAxisLabel?, showValues (bool), groupLabel? }

3. **stacked_bar** — Composition breakdowns, revenue stacks, market segmentation.
   Data: { categories: [{ label, segments: [{ label, value, displayValue, color }] }], orientation ("horizontal"|"vertical"), showLegend (bool) }

4. **donut** — Exhaustion %, market composition, portfolio allocation, completion rates.
   Data: { segments: [{ label, value, displayValue, color }], centerLabel (bold center text), centerSubLabel?, size? }

5. **funnel** — TAM/SAM/SOM, pipeline conversion, attrition rates.
   Data: { stages: [{ label, value (display string), sublabel?, widthPercent (0-100), color }], title? }

6. **waterfall** — Revenue build-up/breakdown, financial impact analysis.
   Data: { items: [{ label, value (number), displayValue, type ("add"|"subtract"|"total") }], startLabel?, endLabel? }

7. **risk_matrix** — Plotting risks on probability vs severity 3x3 grid.
   Data: { risks: [{ label (max 40 chars), probability ("Low"|"Medium"|"High"), severity ("Low"|"Medium"|"High"), id (string number) }] }

8. **flow_diagram** — Validation flows, buying processes, value chains, gate flows.
   Data: { steps: [{ label, sublabel?, status? ("complete"|"current"|"pending"|"missing"), icon? }], direction ("horizontal"|"vertical"), connectorLabel?, flowType ("linear"|"branching") }

9. **timeline** — Trigger windows, purchase timelines, regulatory milestones.
   Data: { events: [{ label, date (display string), description?, urgency ("immediate"|"near_term"|"medium_term"|"long_term"), type? ("milestone"|"deadline"|"window"|"risk") }], title? }

10. **gauge** — Single-metric: exhaustion rates, confidence levels, fit scores.
    Data: { value (0-100), displayValue, label, thresholds: { green (number), amber (number) }, size? }

11. **comparison_strip** — Before/after contrasts, gap analysis.
    Data: { pairs: [{ label, before: { value, sublabel? }, after: { value, sublabel? }, changeLabel?, changeType ("positive"|"negative"|"neutral") }] }

12. **two_by_two** — Competitive positioning, strategic prioritisation.
    Data: { xAxis: { label, lowLabel, highLabel }, yAxis: { label, lowLabel, highLabel }, items: [{ label, x (0-100), y (0-100), size?, color? }], quadrantLabels?: { topLeft, topRight, bottomLeft, bottomRight } }

13. **layered_diagram** — Moat architecture, capability stacks, defence layers.
    Data: { layers: [{ label, description, strength ("strong"|"moderate"|"weak") }], direction ("bottom_up"|"top_down"), title? }

14. **scorecard** — Executive KPI snapshots, multi-metric overviews.
    Data: { metrics: [{ label, value, trend? ("up"|"down"|"flat"), status ("positive"|"warning"|"negative"|"neutral"), sublabel? }], columns? (default 3, max 4) }

15. **heatmap_table** — Multi-dimensional assessments with colour intensity.
    Data: { headers: string[], rows: [{ label, cells: [{ value, intensity ("strong"|"moderate"|"weak"|"none") }] }] }

## Colour Palette for Visual Data

Use these colours when specifying colors in data:
- #1a1f36 (dark navy — primary/largest)
- #2563eb (blue — secondary)
- #0ea5e9 (sky blue — tertiary)
- #059669 (green — positive/strong)
- #d97706 (amber — moderate/warning)
- #dc2626 (red — negative/critical)
- #7c3aed (purple — supplementary)
- #64748b (grey — neutral/baseline)

## Rules

- Extract 4-8 visuals per chapter
- Each visual must map to a specific section
- Prioritise visuals that convey numbers, comparisons, progressions, or decisions
- Every chapter's Risks and Next Steps section should get a risk_matrix
- Extract REAL data from the text — do not invent numbers that aren't there
- If the text doesn't contain enough data for a visual type, skip it
- Each visual needs a unique id (use "v1", "v2", etc.)
- Return ONLY a valid JSON array of objects. No markdown, no explanation, no code fences.

## Output Schema

[
  {
    "id": "v1",
    "type": "scorecard",
    "title": "Chapter Headline Metrics",
    "targetSection": "Overview",
    "data": { ... },
    "caption": "optional caption",
    "insight": "one-line analytical takeaway"
  },
  ...
]
`;

export const CHAPTER_VISUAL_RULES: Record<string, string> = {
  "opportunity-validation": `## Opportunity Validation — Visual Selection Guide

Target 5-7 visuals:
- Overview → scorecard (3-4 headline metrics)
- Problem and Customer Definition → comparison_strip (before/after, gap visualisation)
- Demand Signals → flow_diagram with status (validation progression, mark confirmed vs missing)
- Demand Signals → gauge (if a single striking metric exists, e.g. exhaustion rate)
- Current Solution and Market Gap → horizontal_bar (revenue gap by alternative)
- Customer Fundamentals → flow_diagram (buying process with gates)
- Risks and Next Steps → risk_matrix (probability vs severity grid)`,

  "market-research": `## Market Research — Visual Selection Guide

Target 6-8 visuals:
- Overview → scorecard (market size, CAGR, key constraint, target segment)
- Market Sizing & Structure → funnel (TAM → SAM → SOM with values)
- Market Sizing & Structure → donut (market composition by segment or geography)
- Trends & Growth → vertical_bar or stacked_bar (growth scenarios or trend comparison)
- Value Chain & Competitive Structure → flow_diagram (value chain stages)
- Buying Cycle & Commercial Dynamics → timeline (buying cycle stages with duration)
- Entry Conditions & Adoption Constraints → flow_diagram with gates (if sequential blocking)
- Risks and Next Steps → risk_matrix`,

  "competitive-analysis": `## Competitive Analysis — Visual Selection Guide

Target 5-7 visuals:
- Overview → scorecard (competitive density, market position)
- Competitive Landscape Overview → two_by_two (position competitors on two strategic axes)
- Market Position & Share Dynamics → horizontal_bar (relative market shares by player)
- Market Position & Share Dynamics → donut (market share composition, alternative view)
- Defensibility & Moat Architecture → layered_diagram (moat layers from foundation to lock-in)
- Defensibility & Moat Architecture → heatmap_table (moat assessment across competitors)
- Risk & Fragility → risk_matrix or heatmap_table`,

  "executive-summary": `## Executive Summary — Visual Selection Guide

Target 4-6 visuals:
- Overview → scorecard (4-6 headline metrics across all chapters)
- Strategic Fit → heatmap_table (Company Requirement vs Market Reality with Fit Level)
- Cross-Chapter Synthesis → horizontal_bar or stacked_bar (confidence levels by chapter)
- Risks and Next Steps → risk_matrix (top risks from all chapters)
- Optional → gauge (overall opportunity confidence score, if chapter assigns one)
- Optional → comparison_strip (key before/after or gap metrics from across chapters)`,
};
