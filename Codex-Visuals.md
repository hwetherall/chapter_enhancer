# Codex-Visuals.md — Innovera Chapter Visual Generator

## Project Overview

Build a web application that takes completed Innovera investment memo chapters and generates a gallery of stunning, individually copy-pasteable visual elements (charts, diagrams, flows, matrices, infographics) rendered as PNGs.

The tool uses a **two-pass AI architecture**:
- **Pass 1 (Extraction):** AI reads the chapter text and returns structured JSON specs for 6-10 visuals.
- **Pass 2 (Rendering):** For each visual spec, AI generates bespoke, self-contained HTML/SVG code following strict design principles. The app renders this HTML in a hidden container and converts it to a PNG via `html-to-image` for clipboard copy.

Only one visual type (Scorecard / Headline Metrics) uses a deterministic React component. All others are AI-rendered, giving each visual bespoke spatial treatment based on its data shape.

Internal Innovera tool. No authentication.

---

## Tech Stack

- **Framework**: Next.js (App Router) on Vercel
- **AI Gateway**: OpenRouter
  - Extraction (Pass 1): `anthropic/claude-sonnet-4-6` (fallback `anthropic/claude-haiku-4-5`)
  - Rendering (Pass 2): `anthropic/claude-sonnet-4-6` (same model, separate call per visual)
- **PNG Conversion**: `html-to-image` (`toBlob` with `pixelRatio: 2`)
- **IDE**: Codex (ChatGPT 5.4)
- **Deployment**: Vercel
- **No database**

---

## Font Standard

**One font everywhere. No exceptions.**

All visual output uses:
```
font-family: system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

Rationale: visuals are pasted into Innovera's platform editor. Google Fonts will not load inside pasted HTML. System-ui renders cleanly across all platforms, supports proper weight ranges, and is the only reliable choice for copy-paste content.

The **app UI itself** (header, input panel, gallery chrome) uses `DM Sans` and `DM Serif Display` loaded via `next/font/google` to match Innovera branding. But nothing inside the visual output cards uses these fonts.

---

## User Flow

1. User selects a chapter type (Opportunity Validation, Market Research, Competitive Analysis, Executive Summary)
2. User pastes the completed chapter text
3. User clicks "Generate Visuals"
4. **Pass 1**: AI extracts 6-10 visual specs as JSON
5. **Pass 2**: For each spec, AI generates bespoke HTML/SVG (parallel calls, up to 4 concurrent)
6. Each visual renders in a hidden container, then converts to a preview image
7. Gallery displays visual cards with preview, title, section label, and buttons
8. User clicks "Copy Visual" on any card — it copies the PNG to clipboard via `html-to-image`
9. User can "Regenerate" any individual visual (re-runs Pass 2 for that one spec)

---

## Architecture

### Directory Structure

```
src/
  app/
    page.tsx                    # Main (and only) page
    api/
      extract-visuals/route.ts  # Pass 1: chapter → JSON visual specs
      render-visual/route.ts    # Pass 2: single visual spec → HTML/SVG code
    globals.css
    layout.tsx
  components/
    visuals/
      ScorecardVisual.tsx       # The ONE deterministic component
      AiVisualRenderer.tsx      # Renders AI-generated HTML in a container
      VisualCard.tsx             # Gallery card with preview, copy, regenerate
      VisualGallery.tsx          # Grid layout for all cards
  lib/
    extraction-prompt.ts        # Pass 1 system prompt + chapter rules
    rendering-prompt.ts         # Pass 2 system prompt (the design brief)
    visual-types.ts             # TypeScript interfaces
    design-system.ts            # Colour palette, typography tokens, shared constants
    samples.ts                  # Sample chapter texts for testing
```

### API Routes

#### `POST /api/extract-visuals` (Pass 1)

Receives `{ chapterType, chapterText }`. Returns `{ visuals: VisualSpec[] }`.

The AI reads the chapter and extracts structured data for each visual. It does NOT generate any HTML. It returns pure data.

#### `POST /api/render-visual` (Pass 2)

Receives `{ spec: VisualSpec }`. Returns `{ html: string }`.

The AI receives ONE visual spec and the design system brief. It generates a complete, self-contained HTML/SVG snippet for that visual. Each call is independent — they can run in parallel.

### Client-Side Flow

```typescript
// 1. Extract visual specs
const { visuals } = await fetch('/api/extract-visuals', {
  method: 'POST',
  body: JSON.stringify({ chapterType, chapterText })
}).then(r => r.json());

// 2. Render each visual in parallel (max 4 concurrent)
const rendered = await Promise.all(
  visuals.map(spec =>
    spec.type === 'scorecard'
      ? { spec, html: null, deterministic: true }    // Use React component
      : fetch('/api/render-visual', {
          method: 'POST',
          body: JSON.stringify({ spec })
        }).then(r => r.json()).then(({ html }) => ({ spec, html, deterministic: false }))
  )
);

// 3. For each rendered visual, inject HTML into hidden container, convert to PNG preview
```

---

## Pass 1: Extraction Prompt

### System Prompt

```
You are a data extraction engine for Innovera, a venture investment platform.
You analyse completed investment memo chapters and extract structured data
specifications for visual elements.

You receive a chapter type and the full chapter text. Return a JSON array
of visual specifications. Extract REAL data from the text. Do not invent
numbers, names, or facts that are not present.

Return ONLY a valid JSON array. No markdown. No code fences. No explanation.
```

### Visual Types Available

The extraction prompt lists these types with their data schemas:

```typescript
type VisualType =
  | "scorecard"          // KPI dashboard strip (deterministic render)
  | "horizontal_bar"     // Comparing values across categories
  | "vertical_bar"       // Time-series, scenarios
  | "stacked_bar"        // Composition breakdowns
  | "donut"              // Proportions, exhaustion rates
  | "funnel"             // TAM/SAM/SOM, pipeline narrowing
  | "waterfall"          // Revenue build-up/breakdown
  | "risk_matrix"        // Probability × Severity grid
  | "flow_diagram"       // Processes, validation chains, value chains
  | "timeline"           // Milestones, trigger windows
  | "gauge"              // Single metric with threshold
  | "comparison_strip"   // Before/after, gap analysis
  | "two_by_two"         // Strategic positioning matrix
  | "layered_diagram"    // Moat stacks, capability layers
  | "heatmap_table";     // Multi-dimensional scored matrix

interface VisualSpec {
  id: string;                    // "v1", "v2", etc.
  type: VisualType;
  title: string;
  targetSection: string;         // Which chapter section this belongs in
  data: Record<string, any>;     // Type-specific structured data
  caption?: string;              // Subtitle / context line
  insight?: string;              // One-line analytical takeaway
}
```

### Data Schemas Per Type

Include in the extraction prompt:

**scorecard:**
```json
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
```

**horizontal_bar:**
```json
{
  "bars": [
    { "label": "Category name", "value": 718560, "displayValue": "$718,560" }
  ],
  "xAxisLabel": "Annual revenue shortfall ($)",
  "showValues": true,
  "highlightIndex": 0
}
```

**vertical_bar:**
```json
{
  "bars": [
    { "label": "Scenario A", "value": 50, "displayValue": "50%" }
  ],
  "yAxisLabel": "Percentage",
  "showValues": true
}
```

**stacked_bar:**
```json
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
```

**donut:**
```json
{
  "segments": [
    { "label": "Exhausted", "value": 93, "displayValue": "93%", "color": "#dc2626" },
    { "label": "Remaining", "value": 7, "displayValue": "7%", "color": "#e2e8f0" }
  ],
  "centerLabel": "93%",
  "centerSubLabel": "Exhausted"
}
```

**funnel:**
```json
{
  "stages": [
    { "label": "NY 6 GW Storage Mandate", "value": "6,000 MW", "sublabel": "State CLCPA + PSC mandate", "widthPercent": 100, "color": "#1a1f36" },
    { "label": "≤5 MW Distributed Class", "value": "≤5 MW projects", "sublabel": "$775M RSIP targets this class", "widthPercent": 80, "color": "#2563eb" }
  ]
}
```

**waterfall:**
```json
{
  "items": [
    { "label": "Base Revenue", "value": 284, "displayValue": "$284/kW-yr", "type": "total" },
    { "label": "LSRV Collapse", "value": -144, "displayValue": "-$144/kW-yr", "type": "subtract" },
    { "label": "Current Floor", "value": 140, "displayValue": "$140/kW-yr", "type": "total" }
  ]
}
```

**risk_matrix:**
```json
{
  "risks": [
    { "label": "Validation deficit", "probability": "High", "severity": "High", "id": "1" },
    { "label": "RSIP block exhaustion", "probability": "High", "severity": "High", "id": "2" }
  ]
}
```

**flow_diagram:**
```json
{
  "steps": [
    { "label": "Third-Party Market Research", "sublabel": "NYISO filings, Modo Energy", "status": "complete" },
    { "label": "Customer Discovery Interviews", "sublabel": "0 of 5-10 target IPP interviews", "status": "missing" }
  ],
  "direction": "horizontal",
  "flowType": "linear"
}
```

**timeline:**
```json
{
  "events": [
    { "label": "RSIP Block Opening", "date": "Q2 2025", "description": "First-come first-served", "urgency": "immediate", "type": "deadline" }
  ]
}
```

**gauge:**
```json
{
  "value": 93,
  "displayValue": "93%",
  "label": "VDER LSRV Exhaustion",
  "thresholds": { "green": 30, "amber": 70 }
}
```

**comparison_strip:**
```json
{
  "pairs": [
    {
      "label": "Revenue Floor per kW-year",
      "before": { "value": "$284", "sublabel": "Full LSRV allocation" },
      "after": { "value": "$140", "sublabel": "93% exhausted" },
      "changeLabel": "↓ 50%",
      "changeType": "negative"
    }
  ]
}
```

**two_by_two:**
```json
{
  "xAxis": { "label": "Market Readiness", "lowLabel": "Nascent", "highLabel": "Mature" },
  "yAxis": { "label": "Competitive Intensity", "lowLabel": "Open field", "highLabel": "Contested" },
  "items": [
    { "label": "NineDot", "x": 80, "y": 75, "color": "#dc2626" }
  ],
  "quadrantLabels": { "topLeft": "Emerging Threat", "topRight": "Red Ocean", "bottomLeft": "White Space", "bottomRight": "Established" }
}
```

**layered_diagram:**
```json
{
  "layers": [
    { "label": "Interconnection Expertise", "description": "In-house NYISO queue navigation", "strength": "strong" },
    { "label": "Regulatory Relationships", "description": "DPS and NYSERDA access", "strength": "moderate" }
  ],
  "direction": "bottom_up"
}
```

**heatmap_table:**
```json
{
  "headers": ["Requirement", "Market Reality", "Fit"],
  "rows": [
    { "label": "Customer Demand", "cells": [
      { "value": "Strong IPP deployment mandates", "intensity": "strong" },
      { "value": "Zero first-party validation", "intensity": "weak" }
    ]}
  ]
}
```

### Chapter-Specific Extraction Rules

Include the relevant block based on `chapterType`:

**Opportunity Validation (target 6-8 visuals):**
- Overview → `scorecard` (3-6 headline metrics: revenue shortfall, attrition rate, exhaustion %, RSIP size, first-party validation status, urgency window)
- Problem and Customer Definition → `funnel` (TAM narrowing to viable pipeline) OR `comparison_strip` (before/after revenue floor)
- Demand Signals → `flow_diagram` with status (validation progression — mark what's confirmed vs. missing)
- Demand Signals → `gauge` (if a single striking exhaustion/attrition metric exists)
- Current Solution and Market Gap → `horizontal_bar` (revenue gap or cost by alternative) OR `waterfall` (revenue breakdown)
- Customer Fundamentals → `flow_diagram` (buying process with veto gates) OR `timeline` (trigger windows)
- Risks and Next Steps → `risk_matrix`

**Market Research (target 6-8 visuals):**
- Overview → `scorecard`
- Market Sizing & Structure → `funnel` (TAM → SAM → SOM)
- Market Sizing & Structure → `donut` (market composition)
- Trends & Growth → `vertical_bar` or `stacked_bar`
- Value Chain & Competitive Structure → `flow_diagram` (value chain stages)
- Buying Cycle & Commercial Dynamics → `timeline`
- Entry Conditions & Adoption Constraints → `flow_diagram` with gates
- Risks and Next Steps → `risk_matrix`

**Competitive Analysis (target 5-7 visuals):**
- Overview → `scorecard`
- Competitive Landscape Overview → `two_by_two`
- Market Position & Share Dynamics → `horizontal_bar` (market shares) OR `donut`
- Defensibility & Moat Architecture → `layered_diagram`
- Defensibility & Moat Architecture → `heatmap_table`
- Risk & Fragility → `risk_matrix`

**Executive Summary (target 4-6 visuals):**
- Overview → `scorecard`
- Strategic Fit → `heatmap_table` (Company Requirement vs. Market Reality vs. Fit Level)
- Cross-Chapter Synthesis → `horizontal_bar` or `stacked_bar`
- Risks and Next Steps → `risk_matrix`
- Optional → `gauge` or `comparison_strip`

---

## Pass 2: Rendering Prompt

This is the core innovation. Each visual spec gets its own AI call that generates bespoke HTML/SVG.

### System Prompt (The Design Brief)

```
You are an expert information designer creating investment-grade data
visualisations for Innovera, a venture capital research platform. Your
audience is VPs of Acquisitions, CFOs, and Investment Committee members
at mid-to-large corporations and infrastructure funds.

You will receive a structured data specification for ONE visual element.
Generate a complete, self-contained HTML snippet that renders this visual
beautifully.

## AESTHETIC DIRECTION

Your visuals should feel like they belong in the Financial Times, The
Economist, or a Goldman Sachs equity research report. The tone is:
EDITORIAL, AUTHORITATIVE, DATA-DENSE, RESTRAINED ELEGANCE.

This means:
- Generous whitespace. Let the data breathe.
- Typography does heavy lifting. Large bold numbers. Small muted labels.
  Clear hierarchy between primary values and supporting context.
- Colour is used sparingly and with intent. One or two accent colours max
  per visual. Most of the palette is navy, slate, and white.
- No decorative gradients, glows, drop shadows on text, or rounded-
  everything. Precision over prettiness.
- Data labels are ALWAYS readable. If text would be cramped, reorganise
  the layout. NEVER let text overflow, truncate, or overlap.

## SPATIAL INTELLIGENCE

This is critical. You MUST adapt the layout to the data shape:
- A 3-step flow gets a clean horizontal layout with generous card widths.
- A 7-step flow gets a vertical timeline or a 2-row wrap, NOT 7 cramped
  horizontal boxes.
- A funnel with 3 tiers gets large tiers. A funnel with 6 tiers gets
  narrower tiers with smaller text.
- A bar chart with 3 bars gets thick bars. A chart with 12 bars gets
  thin bars with adjusted label sizes.
- A risk matrix with 2 items in one cell staggers them. With 4 items,
  it uses a 2x2 sub-grid.
- ALWAYS preview mentally: "If I were reading this at 720px wide, can I
  read every label? Does anything overlap?" If yes, redesign the layout.

## TECHNICAL CONSTRAINTS

- Output ONLY the HTML. No markdown. No code fences. No explanation.
- ALL styling MUST be inline (style="..." on every element).
- Use inline SVG for charts, arcs, bars, grid lines, etc.
- Use HTML divs with inline flexbox/grid for flow diagrams, scorecards,
  timelines, and any text-heavy layouts.
- Font on every text element: font-family: system-ui, -apple-system,
  'Segoe UI', Helvetica, Arial, sans-serif
- Maximum width: 720px. The outer wrapper div must set max-width: 720px.
- Background: white (#ffffff).
- The output must render correctly when injected via innerHTML into a div.
  No <html>, <head>, <body>, <script> tags. No external resources.

## COLOUR PALETTE

Use ONLY these colours:

Primary fills:
  #0f172a  (near-black navy — dark panels, primary bars, header strips)
  #1e293b  (dark slate — secondary fills, text on light bg)
  #334155  (medium slate — tertiary fills)

Accent (use sparingly):
  #2563eb  (blue — ONE accent colour for highlights, active states)
  #0ea5e9  (sky blue — connectors, secondary accent)

Semantic:
  #059669  (green — positive, strong, confirmed, complete)
  #d97706  (amber — moderate, warning, in-progress)
  #dc2626  (red — negative, critical, missing, gap, risk)

Neutral:
  #64748b  (grey — axis labels, muted text, sublabels)
  #94a3b8  (light grey — very muted text, step numbers)
  #e2e8f0  (border grey — gridlines, cell borders, dividers)
  #f1f5f9  (near-white — alternating row bg, subtle fills)
  #f8fafc  (off-white — card backgrounds, light panels)

Text:
  #ffffff  (white — text on dark panels)
  #0f172a  (near-black — primary text on light bg)
  #475569  (dark grey — secondary text, legend items)

## STRUCTURE OF EVERY VISUAL

Every visual MUST follow this structure:

1. OUTER WRAPPER: <div style="font-family: system-ui, ...; max-width: 720px;
   padding: 28px 32px; background: #ffffff;">

2. TITLE BLOCK: A left-aligned title with a 3px-wide vertical accent bar
   (blue #2563eb) to its left. Title in 15-16px, weight 700, colour #0f172a.
   Optional caption below in 12px italic #94a3b8.

3. THE VISUAL: The chart, diagram, flow, matrix, etc. Generous top margin
   (20-28px) below the title block.

4. INSIGHT LINE: Below the visual, separated by a 1px #f1f5f9 border-top.
   "INSIGHT" label in 9px uppercase #475569, followed by the insight text
   in 12px #64748b. This should be an analytical sentence, not a description
   of the visual.

## SPECIFIC DESIGN PATTERNS

### Bar Charts (horizontal_bar, vertical_bar)
- Bars should have subtle gradients (same colour, 92% → 100% opacity)
- A single thin baseline at x=0 in #e2e8f0
- One or two light gridlines only (at 50% and 100% of max). No grid noise.
- Value labels outside bars in 11px bold #0f172a
- Category labels in 11px #475569, right-aligned for horizontal bars
- Highlighted bar gets a 2px blue accent line at its leading edge

### Funnel
- True trapezoids (angled sides), not just rectangles of decreasing width
- SVG path-based with rounded corners (radius 6px)
- Label text left-aligned inside each tier, value right-aligned and large (22-26px bold white)
- Tier colours should progress: dark navy → blue → sky blue → green → amber → red
  (i.e. strongest/broadest tier is darkest, narrowest is most vivid)
- Sublabel below the main label in reduced opacity white

### Flow Diagrams
- CRITICAL: If steps > 4, use VERTICAL layout. Do not cram horizontally.
- Each step is a card with a 3px left-border coloured by status
- Status colours: complete=#059669, current=#2563eb, pending=#64748b, missing=#dc2626
- Missing steps get a red "GAP" or "MISSING" badge (absolute positioned, top-right)
- Step number ("STEP 1") in 9px muted text above the label
- Connectors: thin SVG arrows between cards
- For vertical layout: arrow points down, cards are full-width
- For horizontal layout: arrow points right, cards share available width equally

### Risk Matrix
- 3×3 grid. Probability on Y-axis (Low→High bottom→top). Severity on X-axis (Low→High left→right).
- Cell background colours by risk zone (red tint for High/High, green tint for Low/Low, amber for moderate zones)
- Risks as numbered dark navy circles (24-28px diameter) with white text
- Position circles within their cell. If multiple risks in one cell, stagger in a sub-grid pattern.
- Legend below the matrix: numbered circles → full risk label
- Axis titles: "PROBABILITY" (rotated, left side), "SEVERITY" (below)

### Timeline
- Horizontal line with event markers
- Events alternate above/below the line for readability
- Urgency determines colour: immediate=red dot, near_term=amber, medium_term=blue, long_term=grey
- Date displayed as a bold label, description below in muted text
- If events > 6, compress spacing and reduce text size

### Donut
- SVG-based. Outer radius ~130px, inner radius ~80px (donut hole ~60% of outer).
- Segments as arc paths. Largest segment starts at 12 o'clock.
- Centre text: large bold value (28-32px) + smaller sublabel below
- Legend to the right of the donut if 2-4 segments, below if more
- Minimum segment: 5 degrees. Collapse smaller into "Other"

### Gauge
- Semi-circular arc (180 degrees). Background arc in #e2e8f0.
- Fill arc coloured by threshold: green below green threshold, amber below amber, red above amber
- Needle or fill-arc approach (your choice based on what looks cleanest for the data)
- Large value text centred below arc (28-32px bold)
- Label below value in 12px muted text

### Comparison Strip
- Side-by-side "Before" and "After" panels in a rounded container
- Before: grey background (#f8fafc), muted text
- After: tinted by change type (green bg for positive, red bg for negative, blue for neutral)
- Centre connector strip with the change label (e.g. "↓ 50%") in accent colour on a tinted badge
- Values in 22-24px bold. Sublabels in 11px muted.

### Two-by-Two Matrix
- 480×480 grid with axis lines and quadrant labels in large muted text
- Items as labelled circles with 6-8px radius, positioned by x/y coordinates
- Quadrant backgrounds in very subtle tints (5-8% opacity)
- Axis labels at the ends of each axis with low/high descriptors

### Layered Diagram
- Stacked horizontal bands. bottom_up = foundation at bottom (widest).
- Each layer slightly narrower than the one below (pyramid effect)
- Strong: dark navy fill. Moderate: blue fill. Weak: dashed border, no fill.
- Label and description text inside each layer. White text on filled layers.

### Heatmap Table
- Standard table with coloured cells based on intensity
- Strong: green bg (#dcfce7), Moderate: amber bg (#fef9c3), Weak: red bg (#fee2e2), None: light grey (#f8fafc)
- Header row: dark navy bg, white text, uppercase 10px
- Cell text coloured to match intensity (dark green, dark amber, dark red, dark grey)
- Cell padding: 12-16px. Font size: 13px.

### Waterfall
- Vertical bars rising from or falling below a running baseline
- Connector lines (1px dashed #e2e8f0) from bar-top to next bar's start
- Add bars: green (#059669). Subtract bars: red (#dc2626). Total bars: dark navy (#0f172a)
- Value labels above add bars, below subtract bars
- Running total shown as a thin horizontal connector between bars

### Scorecard
- NOTE: This type is rendered by a deterministic React component, NOT by this AI prompt.
  It is listed here only for reference. You will never receive a scorecard spec.
```

### User Message for Pass 2

```
Generate a self-contained HTML visual for the following specification.

Type: {spec.type}
Title: {spec.title}
Target Section: {spec.targetSection}
Caption: {spec.caption || 'none'}
Insight: {spec.insight || 'none'}

Data:
{JSON.stringify(spec.data, null, 2)}

Output ONLY the HTML. No markdown. No code fences. No explanation.
```

---

## Deterministic Component: Scorecard

The Scorecard is the only component that renders deterministically via a React component. It does NOT go through Pass 2.

### Why Keep This Deterministic

The scorecard's design is already excellent and highly consistent. It has a clear two-tier structure (hero metrics on dark strip, supporting metrics on light strip) that works for any data shape because the grid automatically adjusts columns. There is no spatial intelligence needed — it's always a grid.

### ScorecardVisual.tsx Specification

Preserve the exact component from the current codebase. Key design elements to maintain:
- Dark navy strip (`#0f172a`) for hero metrics (top 3-4 based on `columns` prop)
- Light strip (`#f8fafc`) for remaining metrics with `#e2e8f0` border
- Status accent dots (6px circles: positive=#059669, warning=#d97706, negative=#dc2626, neutral=#64748b)
- Trend indicators (▲ ▼ —) in status colour next to value
- Labels: 9px uppercase tracked, muted white on dark / muted grey on light
- Values: 30px bold white on dark / 22px bold navy on light
- Sublabels: 11px reduced opacity below values
- Title block with 3px blue accent bar, matching all other visuals
- Insight line with separator, matching all other visuals
- **Font**: `system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif` on ALL text elements
- **Outer wrapper**: `max-width: 720px; padding: 28px 32px; background: #ffffff;`

---

## AiVisualRenderer Component

This component takes the HTML string from Pass 2 and renders it safely.

```typescript
// components/visuals/AiVisualRenderer.tsx
interface Props {
  html: string;
  onReady?: () => void;  // fired when content is rendered and ready for screenshot
}
```

Implementation approach:
- Render the HTML inside a `<div ref={containerRef} dangerouslySetInnerHTML={{ __html: html }} />`
- The container is styled with `background: #ffffff; max-width: 720px;`
- After render, call `onReady()` so the parent can trigger `html-to-image` conversion
- For the gallery preview, render a scaled-down version (CSS `transform: scale(0.5)` with `transform-origin: top left` inside a fixed-height container)

---

## Copy Mechanism

### Primary: PNG to Clipboard

```typescript
import { toBlob } from 'html-to-image';

const handleCopy = async (containerRef: RefObject<HTMLDivElement>) => {
  const blob = await toBlob(containerRef.current!, {
    pixelRatio: 2,           // Retina quality
    backgroundColor: '#ffffff',
    width: 720,              // Force consistent width
  });
  if (!blob) throw new Error('Render failed');
  await navigator.clipboard.write([
    new ClipboardItem({ 'image/png': blob }),
  ]);
};
```

### Secondary: HTML to Clipboard (optional, behind a toggle)

For cases where Innovera's editor accepts rich HTML:

```typescript
const handleCopyHtml = async (html: string) => {
  await navigator.clipboard.write([
    new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([html], { type: 'text/plain' }),
    }),
  ]);
};
```

The "Copy Visual" button copies PNG by default. A small secondary "Copy HTML" link sits below it.

---

## UI / Branding

### Brand Tokens (App Chrome Only)

```css
:root {
  --color-bg-light:        #F5F0EC;
  --color-bg-dark:         #1A1C22;
  --color-card-dark:       #252830;
  --color-primary:         #E8503A;
  --color-primary-hover:   #D4432E;
  --color-secondary:       #F59E3A;
  --color-text-dark:       #1A1C22;
  --color-text-light:      #FFFFFF;
  --color-text-muted:      #9CA3AF;
  --color-text-label:      #6B7280;
}
```

### Logo

```svg
<svg width="36" height="36" viewBox="0 0 36 36" fill="none">
  <rect width="36" height="36" fill="#E8503A"/>
  <polygon points="18,8 30,28 6,28" fill="white"/>
</svg>
```

Wordmark: "INNOVERA" in all-caps, `letter-spacing: 0.12em`, weight 500.

### Page Layout

- **Header**: Sticky, dark charcoal (`#1A1C22`), logo + wordmark left, "Chapter Visuals" label
- **Input zone**: Cream background (`#F5F0EC`). Chapter type pills, textarea, generate button.
  - Section markers: `//` in coral + uppercase grey label (e.g. `// CHAPTER TYPE`)
  - CTA button: coral `#E8503A`, white text, uppercase tracked, pill-shaped
- **Gallery zone**: White background (`#ffffff`). Grid of visual cards.
  - Grid: 2 columns on lg+, 1 column on smaller screens
  - Cards: white bg, `1px solid #e2e8f0`, `border-radius: 12px`, subtle shadow

### Visual Card Structure

```
┌──────────────────────────────────────────┐
│  SECTION NAME (muted uppercase)    [type]│  ← header bar, #f8fafc bg
│  Visual Title (bold)                     │
├──────────────────────────────────────────┤
│                                          │
│          [Scaled preview of the          │  ← white bg, rendered visual
│           visual at 50% scale]           │     scaled via CSS transform
│                                          │
├──────────────────────────────────────────┤
│  [Copy Visual]  [Copy HTML]  [Regenerate]│  ← footer bar, #f8fafc bg
└──────────────────────────────────────────┘
```

### Loading States

- During Pass 1: "Analysing chapter and extracting visual data..." with spinner
- During Pass 2: Each card shows a skeleton pulse while its AI call completes. Cards appear individually as they resolve (not all at once).
- Skeleton card: `#f8fafc` block with subtle pulse animation, matching card dimensions

---

## Error Handling

### Pass 1 Failures
- OpenRouter down / rate limited → retry once after 2 seconds, then show error
- AI returns non-JSON → show "Extraction failed, try again" with retry button
- Zero visuals extracted → show "No visualisable data found in this chapter"

### Pass 2 Failures (Per-Visual)
- If a single visual's render call fails, show an error state on that card only ("Render failed — click Regenerate")
- Other visuals continue rendering independently
- AI returns broken HTML → show the error card, don't attempt to render it

### Input Validation
- Minimum 200 characters (show helpful message)
- Maximum 80,000 characters (show "Chapter text too long, try pasting one chapter at a time")

---

## Regeneration

### Per-Visual Regeneration

When user clicks "Regenerate" on a single card:
1. Keep the same `VisualSpec` from Pass 1
2. Re-run Pass 2 for that one spec (single API call)
3. Replace the card content when the new HTML arrives
4. The AI will produce a different visual design for the same data (natural variation in AI output)

### Full Regeneration

"Regenerate All" button in the gallery header:
1. Keep the same visual specs from Pass 1
2. Re-run Pass 2 for all specs
3. All cards enter loading state and resolve independently

### Re-Extract

"Re-Extract" button next to "Generate Visuals":
1. Re-runs Pass 1 with the same input text
2. May produce different visual specs (different types, different data focus)
3. Then runs Pass 2 for all new specs

---

## Implementation Order

1. **Design system constants** (`lib/design-system.ts`) — colour palette, font string, shared tokens
2. **Type definitions** (`lib/visual-types.ts`) — VisualSpec, VisualType, all data interfaces
3. **ScorecardVisual component** — port from current codebase, update font to system-ui
4. **AiVisualRenderer component** — renders HTML string, exposes ref for screenshot
5. **Pass 2 API route** (`/api/render-visual`) — single visual spec → AI-generated HTML
6. **Test Pass 2 in isolation** — hardcode a funnel spec and a flow diagram spec, verify HTML output renders correctly and copies as PNG
7. **Pass 1 API route** (`/api/extract-visuals`) — chapter text → JSON visual specs
8. **VisualCard component** — card chrome, copy button, regenerate button, preview scaling
9. **VisualGallery component** — grid layout, loading states
10. **Main page** — wire everything together: input → extract → render → gallery
11. **Samples** — sample chapter texts for each chapter type
12. **Polish** — error states, loading UX, regeneration flows

---

## Testing Checklist

- [ ] Scorecard renders identically to current production version
- [ ] Pass 2 generates valid HTML for all 14 AI-rendered visual types
- [ ] Flow diagram with 7 steps renders vertically (not horizontally)
- [ ] Funnel with 5 tiers has readable text on every tier
- [ ] Risk matrix with 5 risks places all circles in correct cells
- [ ] "Copy Visual" produces a crisp 2x PNG in clipboard
- [ ] Pasting the PNG into Google Docs / Word / a WYSIWYG editor looks correct
- [ ] "Regenerate" on a single card only re-renders that card
- [ ] Failed Pass 2 call shows error on that card without breaking others
- [ ] Gallery handles 8 visuals without layout issues
- [ ] Full page load → generate → copy workflow completes in under 60 seconds

---

## Environment Variables

```env
OPENROUTER_API_KEY=        # Required
```

---

## What This Tool Does NOT Do

- Does not modify chapter text or tables
- Does not store data
- Does not handle authentication
- Does not use external charting libraries (Chart.js, D3, Recharts)
- Does not use `<canvas>` — all rendering is HTML/SVG via `dangerouslySetInnerHTML`
- Does not generate the chapter structure or formatting (that is the Chapter Enhancer's job)
