# CLAUDE.md — Innovera Chapter Visuals Generator

## Project Overview

Build a web application that takes completed Innovera investment memo chapters (text + tables) and generates a set of standalone visual elements — charts, diagrams, flows, matrices, and infographics — that can be individually copy-pasted back into the Innovera platform's chapter editor.

This is the **visual companion** to the Chapter Enhancer tool. The Chapter Enhancer handles text structure and tables. This tool handles everything visual: bar charts, funnels, risk matrices, flow diagrams, gauges, waterfall charts, timelines, and more.

Each visual is rendered as a standalone, self-contained HTML/SVG snippet with inline styles. Users select which visuals they want, preview them, and copy them one at a time into specific chapter sections.

This is an internal Innovera tool. No authentication required.

---

## Tech Stack

- **Framework**: Next.js (App Router) on Vercel
- **AI Gateway**: OpenRouter — model `anthropic/claude-sonnet-4-5` (fallback: `anthropic/claude-haiku-4-5`, log warning)
- **Rendering**: Inline SVG and styled HTML (no charting libraries — everything must be self-contained for copy-paste)
- **IDE**: Cursor
- **Deployment**: Vercel
- **No database required**

---

## User Flow

1. User selects a chapter type (Opportunity Validation, Market Research, Competitive Analysis, Executive Summary)
2. User pastes the completed chapter text (the full output from the Innovera platform, including tables)
3. User clicks "Generate Visuals"
4. The AI analyses the chapter content and returns a structured JSON payload specifying each visual: its type, title, data points, and the section it belongs to
5. The app renders each visual as a standalone HTML/SVG card in a gallery view
6. Each card has its own "Copy" button — user copies individual visuals and pastes them into the relevant section in Innovera
7. User can click "Regenerate" on any individual visual to get a variant

---

## Architecture

### Pages

**Single page app (`/`)** with a two-zone layout:
- **Top zone**: Chapter type selector + text input area + "Generate Visuals" button
- **Bottom zone**: Visual gallery — a grid of rendered visual cards, each with a title, the target section name, and a copy button

### API Route

**`/api/generate-visuals`** — POST endpoint

**Step 1: Extraction.** The AI reads the chapter text and extracts structured data suitable for visualisation. It returns a JSON array of visual specifications.

**Step 2: Rendering.** The frontend takes each visual spec and renders it as inline HTML/SVG using deterministic rendering functions (not AI-generated HTML). This ensures visual consistency and avoids broken output.

The AI does NOT generate the HTML/SVG directly. It extracts data and selects visual types. The rendering is handled by the frontend.

```typescript
// API response shape
interface VisualSpec {
  id: string;                    // unique identifier
  type: VisualType;              // enum of supported visual types
  title: string;                 // display title for the visual
  targetSection: string;         // which chapter section this visual belongs in
  data: Record<string, any>;     // type-specific data payload (see Visual Type Specs below)
  caption?: string;              // optional caption/subtitle
  insight?: string;              // one-line analytical takeaway to display below the visual
}

type VisualType =
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
```

### System Prompt for Extraction

The system prompt tells the AI:
- Here is the chapter type and its section structure
- Here are the visual types available (with data schemas)
- Analyse the chapter text and extract 4-8 visual specs
- Each visual must map to a specific section
- Prioritise visuals that convey numbers, comparisons, progressions, or decisions
- Do NOT generate visuals for sections that work better as tables only (per the rules below)
- Return ONLY valid JSON — no markdown, no explanation

---

## UI / Branding

### Brand Tokens

Same as the Chapter Enhancer tool:

```css
:root {
  --color-bg-light:        #F5F0EC;
  --color-bg-dark:         #1A1C22;
  --color-card-dark:       #252830;
  --color-border-dark:     rgba(255, 255, 255, 0.07);
  --color-border-light:    rgba(0, 0, 0, 0.08);
  --color-primary:         #E8503A;
  --color-primary-hover:   #D4432E;
  --color-secondary:       #F59E3A;
  --color-text-dark:       #1A1C22;
  --color-text-light:      #FFFFFF;
  --color-text-muted:      #9CA3AF;
  --color-text-label:      #6B7280;
}
```

### Layout

- App chrome: dark charcoal `#1A1C22`
- Input zone: cream `#F5F0EC` background for the input area
- Visual gallery: white background (`#ffffff`) so visuals render as they will in the Innovera editor
- Each visual card: white bg, subtle border `1px solid #e2e8f0`, `border-radius: 12px`, `box-shadow: 0 1px 3px rgba(0,0,0,0.08)`
- Card header: section name in muted grey + visual title in bold
- Card footer: copy button (coral `#E8503A`) + regenerate button (outline)

### Typography

- `DM Serif Display` for page headings
- `DM Sans` for everything else
- `//` section markers in coral for section labels

---

## Visual Output Rules

### Critical Constraint: Copy-Paste Compatibility

Every visual must be a single, self-contained HTML snippet that:
- Uses ONLY inline styles (no CSS classes, no `<style>` blocks)
- Uses inline SVG for all charts and diagrams (no `<canvas>`, no external images, no charting libraries)
- Is wrapped in a single outer `<div>` with explicit width, font-family, and padding
- Renders correctly when pasted into a WYSIWYG rich text editor
- Looks good at a max-width of 800px (the typical Innovera content width)

### Colour Palette for Visuals

All visuals use this consistent palette:

```
Primary series (for bars, segments, fills):
  #1a1f36  (dark navy — primary/largest segment)
  #2563eb  (blue — secondary)
  #0ea5e9  (sky blue — tertiary)
  #059669  (green — positive/strong)
  #d97706  (amber — moderate/warning)
  #dc2626  (red — negative/critical)
  #7c3aed  (purple — supplementary)
  #64748b  (grey — neutral/baseline)

Backgrounds:
  #f8fafc  (light grey — chart background)
  #f0f4ff  (light blue — highlight areas)
  #ffffff  (white — card background)

Text:
  #1e293b  (dark — primary labels)
  #64748b  (grey — secondary labels, axis text)
  #ffffff  (white — text on dark fills)

Borders and gridlines:
  #e2e8f0  (light grey)
```

### Typography in Visuals

All text in SVG uses `font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"`.

| Element | Size | Weight | Colour |
|---|---|---|---|
| Chart title | 16px | 600 | #1e293b |
| Axis labels | 11px | 400 | #64748b |
| Data labels (on bars/segments) | 12px | 600 | #ffffff or #1e293b depending on contrast |
| Value callouts | 14px | 700 | #1e293b |
| Caption / insight line | 13px | 400 | #64748b (italic) |
| Legend items | 12px | 400 | #64748b |

### Standard Dimensions

- Default visual width: 720px (fits within 800px content area with padding)
- Default visual height: varies by type (see specs below)
- Padding inside outer div: 24px
- SVG viewBox should use the full width/height with no internal padding (padding is on the outer div)

---

## Visual Type Specifications

### 1. Horizontal Bar Chart (`horizontal_bar`)

**Use for**: Comparing values across categories. Revenue figures, cost comparisons, market shares, severity rankings.

**Data schema**:
```typescript
{
  bars: Array<{
    label: string;       // category name
    value: number;       // numeric value
    displayValue: string; // formatted string (e.g. "$718,560", "93%")
    color?: string;      // override colour (otherwise uses series order)
  }>;
  xAxisLabel?: string;   // optional axis label
  showValues: boolean;   // show value labels on bars (default: true)
  maxValue?: number;     // optional max for scale (auto-calculated if omitted)
  highlightIndex?: number; // index of bar to visually emphasise
}
```

**Rendering rules**:
- SVG viewBox: `0 0 720 {barCount * 52 + 60}`
- Bar height: 32px, gap between bars: 20px
- Labels left-aligned at x=0, bars start at x=200 (reserve 200px for labels)
- Bar width proportional to value/maxValue, max bar width = 480px
- Value labels rendered at the end of each bar (inside if bar is wide enough, outside if narrow)
- Highlighted bar gets a 2px border and slightly darker fill
- Light gridlines at 25%, 50%, 75%, 100% of max

**Example use**: Revenue shortfall per project ($718,560), cost of delay ($349,300), severity of workflow pain points

---

### 2. Vertical Bar Chart (`vertical_bar`)

**Use for**: Time-series comparisons, scenario comparisons, before/after metrics.

**Data schema**:
```typescript
{
  bars: Array<{
    label: string;
    value: number;
    displayValue: string;
    color?: string;
  }>;
  yAxisLabel?: string;
  showValues: boolean;
  groupLabel?: string;   // label below the chart
}
```

**Rendering rules**:
- SVG viewBox: `0 0 720 400`
- Bars centered with equal spacing, bar width = min(80px, available space / barCount - gap)
- Value labels above each bar
- Y-axis with horizontal gridlines at rounded intervals
- Bars grow upward from baseline

---

### 3. Stacked Bar Chart (`stacked_bar`)

**Use for**: Composition breakdowns, revenue stack components, market segmentation.

**Data schema**:
```typescript
{
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
```

**Rendering rules**:
- Each bar is divided into coloured segments proportional to their values
- Legend rendered below the chart if `showLegend` is true
- Segment labels inside segments if they are wide/tall enough, otherwise in legend only

---

### 4. Donut Chart (`donut`)

**Use for**: Exhaustion percentages (VDER 93% exhausted), market composition, portfolio allocation, completion rates.

**Data schema**:
```typescript
{
  segments: Array<{
    label: string;
    value: number;
    displayValue: string;
    color: string;
  }>;
  centerLabel: string;      // bold text in the donut hole (e.g. "93%")
  centerSubLabel?: string;  // smaller text below center label (e.g. "Exhausted")
  size?: number;            // diameter in px (default: 280)
}
```

**Rendering rules**:
- SVG viewBox centred on the donut
- Outer radius: size/2, inner radius: size/2 * 0.6 (donut hole = 60% of radius)
- Segments rendered as SVG arcs using `stroke-dasharray` and `stroke-dashoffset` on circles, OR as `<path>` arc segments
- Center text: large bold number + smaller subtitle
- Legend below the donut, horizontal layout if 2-4 items, vertical if more
- Minimum segment angle: 5 degrees (collapse smaller segments into "Other")
- Total chart area: 720 x 360

---

### 5. Funnel Chart (`funnel`)

**Use for**: TAM/SAM/SOM, pipeline conversion, attrition rates, filtering logic.

**Data schema**:
```typescript
{
  stages: Array<{
    label: string;        // stage name
    value: string;        // display value (e.g. "$8.5B", "30.9 GW", "91%")
    sublabel?: string;    // additional context
    widthPercent: number; // 0-100, controls how wide this tier is (100 = widest)
    color: string;
  }>;
  title?: string;
}
```

**Rendering rules**:
- Render as stacked trapezoids, each tier narrower than the one above
- Each tier: centered, `widthPercent`% of 680px max width
- Tier height: 64px, gap between tiers: 4px
- Trapezoid shape: CSS `clip-path` or SVG polygon with angled sides connecting to the tier below
- Label and value centred inside each tier in white text
- If sublabel exists, render in smaller text below the value
- Overall: 720 x (stageCount * 68 + 40)

---

### 6. Waterfall Chart (`waterfall`)

**Use for**: Revenue build-up or breakdown, showing how a total is constructed from additions and subtractions. Financial impact analysis.

**Data schema**:
```typescript
{
  items: Array<{
    label: string;
    value: number;
    displayValue: string;
    type: "add" | "subtract" | "total";
  }>;
  startLabel?: string;    // label for the starting baseline
  endLabel?: string;      // label for the final total
}
```

**Rendering rules**:
- Vertical bars connected by thin horizontal connectors showing running total
- "Add" bars: green (#059669)
- "Subtract" bars: red (#dc2626)
- "Total" bars: dark navy (#1a1f36)
- Connector lines: 1px dashed #e2e8f0 from bar top to next bar's starting point
- Value labels above/below bars
- SVG viewBox: `0 0 720 400`

---

### 7. Risk Matrix (`risk_matrix`)

**Use for**: Plotting risks on a probability vs. severity 2x2 or 3x3 grid. The single most useful visual for the Risks and Next Steps section.

**Data schema**:
```typescript
{
  risks: Array<{
    label: string;        // short risk name (max 40 chars)
    probability: "Low" | "Medium" | "High";
    severity: "Low" | "Medium" | "High";
    id: string;           // displayed as a circled number on the matrix
  }>;
}
```

**Rendering rules**:
- 3x3 grid with Probability on Y-axis (Low bottom, High top) and Severity on X-axis (Low left, High right)
- Cell colours:
  - High/High: `#fef2f2` (red tint)
  - High/Medium, Medium/High: `#fff7ed` (orange tint)
  - Medium/Medium: `#fffbeb` (amber tint)
  - Low/Low, Low/Medium, Medium/Low: `#f0fdf4` (green tint)
  - High/Low, Low/High: `#fffbeb` (amber tint)
- Risk items plotted as numbered circles (24px diameter, dark navy fill, white text) placed in the appropriate cell
- Legend below the matrix listing each number → full risk name
- Grid size: 480px x 480px, centred within 720px viewBox
- Axis labels: "PROBABILITY →" and "SEVERITY →"

---

### 8. Flow Diagram (`flow_diagram`)

**Use for**: Validation flows, buying processes, value chains, gate flows, decision trees.

**Data schema**:
```typescript
{
  steps: Array<{
    label: string;        // step name
    sublabel?: string;    // description
    status?: "complete" | "current" | "pending" | "missing";
    icon?: string;        // optional emoji
  }>;
  direction: "horizontal" | "vertical";
  connectorLabel?: string; // text on the arrows (e.g. "then", "if yes")
  flowType: "linear" | "branching";
}
```

**Rendering rules**:
- **Horizontal**: Steps as rounded boxes (`border-radius: 10px`), connected by arrow lines with arrowheads
  - Step box: 140px wide, auto-height, padding 16px
  - Complete: green border + green left bar
  - Current: blue border + blue left bar
  - Pending: grey border
  - Missing: red dashed border + red "MISSING" badge
  - Arrow: SVG line with arrowhead marker, colour `#0ea5e9`
- **Vertical**: Same boxes but stacked vertically with downward arrows
- Wrap to new row if more than 5 horizontal steps
- Use HTML divs with flexbox (not SVG) for better text wrapping in flow diagrams

---

### 9. Timeline (`timeline`)

**Use for**: Trigger windows, purchase timelines, regulatory milestones, development sequences.

**Data schema**:
```typescript
{
  events: Array<{
    label: string;
    date: string;         // display date or timeframe (e.g. "Q2 2026", "4-6 weeks")
    description?: string;
    urgency: "immediate" | "near_term" | "medium_term" | "long_term";
    type?: "milestone" | "deadline" | "window" | "risk";
  }>;
  title?: string;
}
```

**Rendering rules**:
- Horizontal timeline with a central line
- Events plotted as circles on the line with labels above/below alternating
- Urgency colours: immediate = red, near_term = amber, medium_term = blue, long_term = grey
- Type icons: milestone = filled circle, deadline = diamond, window = horizontal bar span, risk = triangle
- Use HTML/CSS layout (not SVG) for text wrapping
- Width: 720px, height: auto based on content

---

### 10. Gauge Chart (`gauge`)

**Use for**: Single-metric visualisation. Exhaustion rates, completion percentages, confidence levels, fit scores.

**Data schema**:
```typescript
{
  value: number;            // 0-100
  displayValue: string;     // formatted (e.g. "93%")
  label: string;            // what this measures
  thresholds: {
    green: number;          // below this = green (e.g. 30)
    amber: number;          // below this = amber, above = red (e.g. 70)
  };
  size?: number;            // diameter (default: 200)
}
```

**Rendering rules**:
- Semi-circular gauge (180-degree arc)
- Background arc: `#e2e8f0`
- Fill arc coloured by threshold: green if value < green threshold, amber if < amber, red if above
- Large value text centred below the arc
- Label below the value
- SVG-based, self-contained
- Total area: 280 x 180

---

### 11. Comparison Strip (`comparison_strip`)

**Use for**: Before/after comparisons, two-state contrasts, gap analysis. E.g. "$284/kW-year → $140/kW-year".

**Data schema**:
```typescript
{
  pairs: Array<{
    label: string;
    before: { value: string; sublabel?: string };
    after: { value: string; sublabel?: string };
    changeLabel?: string;    // e.g. "↓ 50%", "Gap: $718K"
    changeType: "positive" | "negative" | "neutral";
  }>;
}
```

**Rendering rules**:
- Each pair rendered as a horizontal strip: [Before value] → [After value] with change indicator
- Before box: grey background
- After box: coloured by changeType (green = positive, red = negative, blue = neutral)
- Arrow/connector between them with changeLabel
- Stack multiple pairs vertically
- Width: 720px

---

### 12. 2x2 Matrix (`two_by_two`)

**Use for**: Competitive positioning, strategic prioritisation, attractiveness vs. feasibility plots.

**Data schema**:
```typescript
{
  xAxis: { label: string; lowLabel: string; highLabel: string };
  yAxis: { label: string; lowLabel: string; highLabel: string };
  items: Array<{
    label: string;
    x: number;     // 0-100 position
    y: number;     // 0-100 position
    size?: number; // optional bubble size
    color?: string;
  }>;
  quadrantLabels?: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
  };
}
```

**Rendering rules**:
- 480px x 480px grid centred in 720px container
- Quadrant background tints (very subtle, ~5% opacity of the quadrant colour)
- Quadrant labels in large muted text
- Items as labelled circles, positioned proportionally
- Axis lines: 2px `#e2e8f0`, axis labels at ends

---

### 13. Layered Diagram (`layered_diagram`)

**Use for**: Moat architecture, capability stacks, defence layers, maturity models.

**Data schema**:
```typescript
{
  layers: Array<{
    label: string;
    description: string;
    strength: "strong" | "moderate" | "weak";
  }>;
  direction: "bottom_up" | "top_down";  // bottom_up = foundation at bottom
  title?: string;
}
```

**Rendering rules**:
- Stacked horizontal bands, full width
- Bottom layer is widest (foundation), each successive layer slightly narrower (pyramid feel)
- Strong: dark navy fill, Moderate: blue fill, Weak: dashed grey border only
- Label and description inside each layer
- Height: 80px per layer

---

### 14. Scorecard (`scorecard`)

**Use for**: Executive summary KPI snapshots, chapter confidence scores, multi-metric overviews.

**Data schema**:
```typescript
{
  metrics: Array<{
    label: string;
    value: string;
    trend?: "up" | "down" | "flat";
    status: "positive" | "warning" | "negative" | "neutral";
    sublabel?: string;
  }>;
  columns?: number;  // grid columns (default: 3, max: 4)
}
```

**Rendering rules**:
- Grid of metric cards, each with large value + label + optional trend arrow + status colour bar at top
- Card: white bg, subtle border, 4px top border coloured by status
- Positive: green, Warning: amber, Negative: red, Neutral: grey
- Responsive grid at specified column count
- Use HTML divs (not SVG)

---

### 15. Heatmap Table (`heatmap_table`)

**Use for**: Multi-dimensional assessments where cells need colour intensity. Fit matrices, capability assessments, competitive scoring.

**Data schema**:
```typescript
{
  headers: string[];
  rows: Array<{
    label: string;
    cells: Array<{
      value: string;
      intensity: "strong" | "moderate" | "weak" | "none";
    }>;
  }>;
}
```

**Rendering rules**:
- Standard table structure with coloured cells
- Strong: `#dcfce7` (green bg), Moderate: `#fef9c3` (amber bg), Weak: `#fee2e2` (red bg), None: `#f8fafc`
- Text in cells coloured to match intensity (dark green, dark amber, dark red, grey)
- Header row: `#1a1f36` bg, white text
- This is distinct from a regular table because every cell carries visual weight through colour

---

## Chapter-Specific Visual Selection Rules

The AI uses these rules to decide which visuals to generate for each chapter type.

### Opportunity Validation — Typical Visual Set (5-7 visuals)

| Section | Recommended Visual | Why |
|---|---|---|
| Overview | `scorecard` — 3-4 headline metrics (revenue shortfall, queue attrition rate, urgency window, pipeline drag) | Gives the reader an instant numeric anchor before the prose |
| Problem and Customer Definition | `comparison_strip` — before/after on revenue floor collapse (e.g. $284 → $140/kW-year) | The 50% drop is the core problem; visualise the gap |
| Demand Signals | `flow_diagram` with status — validation progression from observed signal → commitment (mark what's confirmed vs. missing) | Shows the evidence chain and highlights the critical gap |
| Demand Signals | `gauge` — VDER LSRV exhaustion (93%) | Single most striking number in the chapter |
| Current Solution and Market Gap | `horizontal_bar` — revenue gap by alternative approach | Shows why no alternative restores the floor |
| Customer Fundamentals | `flow_diagram` — IPP acquisition decision flow (need → evaluation → approval → purchase) | The buying process is sequential with veto gates |
| Risks and Next Steps | `risk_matrix` — plot all risks on probability vs. severity grid | The most useful single visual for any risk section |

### Market Research — Typical Visual Set (6-8 visuals)

| Section | Recommended Visual | Why |
|---|---|---|
| Overview | `scorecard` — market size, CAGR, key constraint metric, target segment | Headline numbers |
| Market Sizing & Structure | `funnel` — TAM → SAM → SOM with values | The single most important market research visual |
| Market Sizing & Structure | `donut` — market composition by segment or geography | Shows concentration |
| Trends & Growth | `vertical_bar` or `stacked_bar` — growth scenarios or trend comparison | If trajectory data exists |
| Value Chain & Competitive Structure | `flow_diagram` — value chain stages | Best candidate for a diagram per Pedram's guide |
| Buying Cycle & Commercial Dynamics | `timeline` — buying cycle stages with duration | Shows the 3-9 month process |
| Entry Conditions & Adoption Constraints | `flow_diagram` with gates — access → qualification → approval → deployment | Only if failure at one stage blocks downstream |
| Risks and Next Steps | `risk_matrix` | Standard |

### Competitive Analysis — Typical Visual Set (5-7 visuals)

| Section | Recommended Visual | Why |
|---|---|---|
| Overview | `scorecard` — competitive density, market HHI, company position | Headline framing |
| Competitive Landscape Overview | `two_by_two` — position competitors on two strategic axes | Classic competitive positioning visual |
| Market Position & Share Dynamics | `horizontal_bar` — relative market shares by player | Shows concentration visually |
| Market Position & Share Dynamics | `donut` — market share composition | Alternative to bars for aggregate view |
| Defensibility & Moat Architecture | `layered_diagram` — moat layers from foundation to lock-in | Shows whether defensibility is deep or shallow |
| Defensibility & Moat Architecture | `heatmap_table` — moat assessment across competitors | Which moats exist and who has them |
| Risk & Fragility | `risk_matrix` or `heatmap_table` — fragility triggers mapped | Standard |

### Executive Summary — Typical Visual Set (4-6 visuals)

| Section | Recommended Visual | Why |
|---|---|---|
| Overview | `scorecard` — 4-6 headline metrics across all chapters | The "at a glance" executive view |
| Strategic Fit | `heatmap_table` — Company Requirement vs. Market Reality with Fit Level colour coding | The core visual for strategic fit |
| Cross-Chapter Synthesis | `horizontal_bar` or `stacked_bar` — confidence levels or key metrics by chapter | Shows relative strength across chapters |
| Risks and Next Steps | `risk_matrix` — top risks from all chapters | Synthesised risk view |
| Optional | `gauge` — overall opportunity confidence score | If the chapter assigns an overall score |
| Optional | `comparison_strip` — key before/after or gap metrics from across chapters | If there are striking contrasts to highlight |

---

## Implementation Notes

### Rendering Engine

Each visual type has a dedicated React component that takes a `VisualSpec` and returns self-contained inline-styled HTML. These components are NOT used for the app's own UI — they are rendering engines for the copy-paste output.

```
/components/visuals/
  HorizontalBarVisual.tsx
  VerticalBarVisual.tsx
  StackedBarVisual.tsx
  DonutVisual.tsx
  FunnelVisual.tsx
  WaterfallVisual.tsx
  RiskMatrixVisual.tsx
  FlowDiagramVisual.tsx
  TimelineVisual.tsx
  GaugeVisual.tsx
  ComparisonStripVisual.tsx
  TwoByTwoVisual.tsx
  LayeredDiagramVisual.tsx
  ScorecardVisual.tsx
  HeatmapTableVisual.tsx
  VisualRenderer.tsx          // dispatches to correct component by type
```

Each component renders to a `<div ref={...}>` that can be copied via `ClipboardItem` with `text/html` MIME type.

**Critical**: every component must produce HTML where ALL styles are inline. No Tailwind classes, no CSS modules, no `<style>` tags in the output. The components can use Tailwind for the app chrome (card wrapper, copy button), but the inner visual content must be pure inline styles.

### Copy Mechanism

Each visual card has a "Copy Visual" button that:
1. Selects the inner visual content (not the card chrome)
2. Writes it to clipboard as both `text/html` and `text/plain`
3. Shows a "Copied" confirmation

```typescript
const handleCopy = async (ref: RefObject<HTMLDivElement>) => {
  const html = ref.current.innerHTML;
  const text = ref.current.innerText;
  await navigator.clipboard.write([
    new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([text], { type: "text/plain" }),
    }),
  ]);
};
```

### Priority Order for Building

1. **Visual rendering components** — build all 15 visual type components first with hardcoded test data. Verify each one copy-pastes cleanly into a rich text editor.
2. **Visual gallery UI** — the card grid layout with copy buttons.
3. **API route** — the extraction prompt + OpenRouter call.
4. **Chapter selector + input** — the top zone.
5. **Regenerate per-visual** — call the API with a targeted prompt for one visual.
6. **Polish** — loading states, error handling.

### Environment Variables

```env
OPENROUTER_API_KEY=        # Required
```

### Testing

Include a "Load sample chapter" button that populates the input with a realistic completed chapter (use the NEE Opportunity Validation chapter as the default sample). This is essential for development iteration.

### OpenRouter Call

```typescript
const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "anthropic/claude-sonnet-4-5",
    max_tokens: 4000,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Analyse this ${chapterType} chapter and extract visual specifications. Return ONLY a JSON array of VisualSpec objects.\n\n${chapterText}`
      },
    ],
  }),
});
```

---

## What This Tool Does NOT Do

- Does not modify chapter text or tables — it only generates visuals
- Does not store data (stateless)
- Does not handle authentication
- Does not use external charting libraries (Chart.js, D3, Recharts) — all rendering is inline HTML/SVG
- Does not generate raster images (PNG, JPG) — output is vector/HTML only
- Does not handle the chapter formatting/structure — that is the Chapter Enhancer tool's job
