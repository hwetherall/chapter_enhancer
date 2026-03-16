# CLAUDE.md — Innovera Chapter Enhancer

## Project Overview

Build a web application that takes raw executive summary or chapter draft text from Innovera investment memos and transforms it into polished, structured chapter content with professional tables, flow diagrams, and visual elements. The output must be copy-pasteable rich HTML that can be pasted directly back into the Innovera platform's chapter editor.

The tool supports four chapter types: Opportunity Validation, Market Research, Competitive Analysis, and Executive Summary. Each chapter has a defined section structure, required tables (with exact column schemas), and optional visual elements. An AI model reads the raw text and produces the enhanced chapter following the rules in this document.

This is an internal Innovera tool. No authentication required.

---

## Tech Stack

- **Framework**: Next.js (App Router) on Vercel
- **AI Gateway**: OpenRouter — model `anthropic/claude-sonnet-4-5` (fallback: `anthropic/claude-haiku-4-5`, log warning)
- **IDE**: Cursor
- **Deployment**: Vercel
- **No database required** — this is a stateless input/output tool

---

## User Flow

1. User selects a chapter type from the four options
2. User pastes executive summary or chapter draft text into the input area
3. User clicks "Enhance Chapter"
4. The app sends the text + chapter-specific system prompt to the AI model via OpenRouter
5. The AI returns structured HTML with all required tables, visuals, and formatting
6. The output renders in a preview panel (right side of screen)
7. User can toggle between rendered preview and raw HTML source
8. User copies the output (rich HTML for WYSIWYG paste, or raw source) and pastes back into Innovera

---

## Architecture

### Pages

**Single page app (`/`)** with a split-panel layout:
- **Left panel**: Chapter type selector + text input area + action buttons
- **Right panel**: Output preview (rendered HTML) or raw source view (toggleable)
- Right panel only appears after processing

### API Route

**`/api/enhance`** — POST endpoint
- Receives: `{ chapterType: string, inputText: string }`
- Builds the system prompt by combining the base output rules (Section 5 of this doc) with the chapter-specific guidelines (Section 6)
- Calls OpenRouter with the assembled prompt
- Returns: `{ html: string }` — the enhanced chapter as HTML
- Error handling: validate input length (min 100 chars, max 50,000), handle OpenRouter errors gracefully, return clear error messages

### Key Constraint: Copy-Paste Output

All HTML output uses **inline styles only** (no CSS classes, no `<style>` blocks, no external stylesheets). This is critical because the output must paste cleanly into rich text editors and the Innovera platform. Every `<table>`, `<div>`, `<h2>`, `<p>`, etc. carries its own complete styling.

---

## UI / Branding

### Aesthetic Direction

Match the Innovera platform: **dual-mode — warm cream light for input, dark charcoal for the output panel**. Think investment-grade software: authoritative, precise, editorial.

### Brand Tokens

```css
:root {
  /* Core palette */
  --color-bg-light:        #F5F0EC;   /* warm cream — input panel background */
  --color-bg-dark:         #1A1C22;   /* deep charcoal — app chrome, header */
  --color-card-dark:       #252830;   /* slightly lighter charcoal — cards on dark bg */
  --color-border-dark:     rgba(255, 255, 255, 0.07);
  --color-border-light:    rgba(0, 0, 0, 0.08);

  /* Brand accent */
  --color-primary:         #E8503A;   /* coral red — CTAs, active states, logo bg */
  --color-primary-hover:   #D4432E;
  --color-secondary:       #F59E3A;   /* amber/gold — warnings, secondary highlights */

  /* Text */
  --color-text-dark:       #1A1C22;
  --color-text-light:      #FFFFFF;
  --color-text-muted:      #9CA3AF;
  --color-text-label:      #6B7280;
}
```

### Logo

Red-coral square (`#E8503A`) with white triangle "A":

```svg
<svg width="36" height="36" viewBox="0 0 36 36" fill="none">
  <rect width="36" height="36" fill="#E8503A"/>
  <polygon points="18,8 30,28 6,28" fill="white"/>
</svg>
```

Wordmark: "INNOVERA" in all-caps, `letter-spacing: 0.12em`, weight 500, next to logo in sticky nav.

### Typography

Load via `next/font/google`:
- **Headings**: `DM Serif Display`
- **Body / UI**: `DM Sans`
- **Labels**: All-caps, `letter-spacing: 0.1em`, weight 500 in DM Sans
- **Section markers**: Prefix section headings with `//` in coral followed by an all-caps label in muted grey (e.g. `// CHAPTER TYPE`)

### Key UI Details

- **CTA button**: Coral `#E8503A`, white text, all-caps tracked label, pill shape
- **Chapter type selector**: Row of pill buttons, selected state uses coral outline + tinted background
- **Input area**: Cream background, subtle border, generous padding
- **Output panel**: White background (so the HTML output renders cleanly against white as it will in Innovera)
- **Copy buttons**: "Copy Rich HTML" (copies rendered content preserving formatting) and "Copy Source" (copies raw HTML string)
- **Loading state**: Skeleton pulse in the output panel while AI processes

### Component Notes

- Use Tailwind CSS, extended with brand tokens in `tailwind.config.js`
- No external component library — build primitives in `components/ui/`
- Responsive: works on 1280px+ desktop primarily. Mobile is secondary.

---

## Output Styling Rules (HTML)

These rules govern the HTML that the AI model generates. They must be included in the system prompt sent to the AI.

### General

- Output ONLY valid HTML. No markdown. No code fences. No preamble.
- ALL styling must be inline (`style="..."` on every element) — no CSS classes, no `<style>` tags.
- Wrap everything in a single `<div style="font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; max-width: 860px; color: #1e293b; line-height: 1.7;">`.

### Colour Palette for Output

These colours are used INSIDE the generated HTML (not the app UI):

| Token | Hex | Usage |
|-------|-----|-------|
| Primary dark | `#1a1f36` | H2 headings, table header backgrounds |
| Primary accent | `#2563eb` | Summary box left-border, section highlights |
| Secondary accent | `#0ea5e9` | Flow diagram connectors, secondary highlights |
| Success / Strong Fit | `#059669` | Green indicators, strong fit badges |
| Warning / Moderate | `#d97706` | Amber indicators, moderate fit badges |
| Danger / Weak | `#dc2626` | Red indicators, risk flags, weak fit badges |
| Light bg | `#f8fafc` | Alternating table row, card backgrounds |
| Accent bg | `#f0f4ff` | Summary/takeaway box backgrounds |
| Border | `#e2e8f0` | Table borders, dividers |
| Body text | `#1e293b` | Primary paragraph text |
| Secondary text | `#64748b` | Metadata, labels, muted content |

### Typography in Output

- H2 (chapter title): `font-size: 24px; font-weight: 700; color: #1a1f36; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 24px;`
- H3 (section title): `font-size: 18px; font-weight: 600; color: #1a1f36; margin-top: 36px; margin-bottom: 12px;`
- Body: `font-size: 15px; line-height: 1.7; color: #1e293b;`

### Tables in Output

- Outer border: `1px solid #e2e8f0`
- Border-collapse: `collapse`
- Width: `100%`
- Header row: `background: #1a1f36; color: #ffffff; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;`
- Header cell padding: `12px 16px`
- Body rows: alternate `#ffffff` and `#f8fafc`
- Body cell: `font-size: 14px; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; vertical-align: top;`
- Minimum column width: `120px`

### Summary / Takeaway Boxes

- Container: `border-left: 4px solid #2563eb; background: #f0f4ff; padding: 20px 24px; border-radius: 0 8px 8px 0; margin: 16px 0;`
- Title inside box: `font-weight: 600; font-size: 15px; color: #1a1f36; margin-bottom: 8px;`
- Body text inside: `font-size: 14px; color: #334155; line-height: 1.6;`

### Flow Diagrams in Output

Render as styled HTML divs with inline flexbox. Do NOT use SVG, canvas, or images.

- Container: `display: flex; align-items: center; gap: 0; flex-wrap: wrap; margin: 20px 0;`
- Each step: `background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; min-width: 140px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.06);`
- Step title: `font-weight: 600; font-size: 13px; color: #1a1f36;`
- Step description: `font-size: 12px; color: #64748b; margin-top: 4px;`
- Arrow connector between steps: `<div style="font-size: 20px; color: #0ea5e9; padding: 0 8px;">→</div>`

### Funnel Visuals (TAM/SAM/SOM)

Render as stacked, progressively narrower centered boxes:

- Outermost (TAM): `width: 100%; background: #1a1f36; color: #fff;`
- Middle (SAM): `width: 75%; background: #2563eb; color: #fff;`
- Innermost (SOM): `width: 50%; background: #059669; color: #fff;`
- Each box: `padding: 16px; text-align: center; border-radius: 6px; margin: 4px auto;`
- Label: `font-weight: 600; font-size: 14px;`
- Value/definition: `font-size: 12px; opacity: 0.85; margin-top: 4px;`

### Risk / Fit Colour Coding

For risk register cells (Probability, Severity):
- High: `background: #fef2f2; color: #dc2626; font-weight: 600;`
- Medium: `background: #fffbeb; color: #d97706; font-weight: 600;`
- Low: `background: #f0fdf4; color: #059669; font-weight: 600;`

For Strategic Fit "Fit Level" cells:
- Strong Fit: `background: #f0fdf4; color: #059669; font-weight: 600;`
- Moderate Fit: `background: #fffbeb; color: #d97706; font-weight: 600;`
- Weak Fit: `background: #fef2f2; color: #dc2626; font-weight: 600;`
- Misaligned: `background: #f5f3ff; color: #7c3aed; font-weight: 600;`

### Prose Rules

- Keep writing tight and analytical. No filler. Every sentence should inform a decision.
- Do not use "leverage", em-dashes, or generic AI phrasing.
- Natural, direct tone. Write like a senior analyst, not a chatbot.

---

## Chapter Specifications

### General Rules Across All Chapters

These rules determine what type of visual element to use for each kind of section:

| Section Type | Default Element |
|---|---|
| Overview / intro sections | Summary box only (no table, no chart) |
| Definition / evidence / comparison sections | One table |
| Sequence-heavy sections | One flow diagram |
| Structure-heavy sections | One diagram |
| Decision-heavy sections | One matrix table |
| Risks & Next Steps | One combined risk + action table |

Sections where a visual (flow/funnel/diagram) should definitely be used:
- Market Sizing & Structure → funnel / waterfall
- Value Chain & Competitive Structure → value chain flow
- Buying Process & Commercial Dynamics → process flow
- Competitive Landscape Overview → optional 2x2
- Defensibility & Moat Architecture → optional layered moat diagram

Sections where visuals should be skipped (tables only):
- Problem and Customer Definition
- Demand Signals
- Current Solution and Market Gap
- Customer Fundamentals
- Strategic Fit
- Trends & Growth
- Policy & Regulatory Environment
- Entry Conditions & Adoption Constraints
- Market Position & Share Dynamics
- Differentiation & Right to Win
- Risk & Fragility
- Risks and Next Steps

### Cross-chapter section rules

**Key Takeaways**: Every chapter ends with a Key Takeaways section. This is its own standalone section — 3-5 crisp bullet points that a reader could skim and understand the chapter's core findings. No table needed.

**Risks and Next Steps**: Every chapter has a combined Risks and Next Steps section (replacing separate "Risks" and "Next Steps" sections). Structure: one risk paired with one mitigation/next step. Always rendered as a risk register table.

---

### Chapter 1: Opportunity Validation

**Chapter summary line** (render at top): "This chapter covers Key Takeaways, Risks and Mitigation strategies, Problem and Customer Definition, Demand Signals, Current Solution and Market Gap, and Customer Fundamentals."

#### Section: Overview
- Element: **Chapter takeaway box** (not a table)
- Purpose: Orient the reader around the problem, evidence, fit, and next steps
- Structure inside the box:
  - What is the problem
  - Who has it
  - Why this matters
  - What decision this chapter supports

#### Section: Problem and Customer Definition
- Element: **Problem / Customer / Stakes table**
- Purpose: Define the problem, identify the customer, explain why it matters. Clarity over narrative.
- Table columns:

| Element | Summary |
|---|---|
| Core problem | [extracted] |
| Primary customer | [extracted] |
| Pain point | [extracted] |
| Trigger | [extracted] |
| Business consequence | [extracted] |

- This is a 2-column key-value table (5 rows). No chart.

#### Section: Demand Signals
- Element: **Evidence table**
- Purpose: Separate observed signals from interpretation. What evidence exists and what kind of intent has been observed.
- Table columns:

| Signal / Evidence | What it shows | Limitation |
|---|---|---|

- Optional second element (only if section is dense): **Validation flow**
  - Flow: `Observed signal → Customer indication → Commercial proof → Commitment`
  - Only include if the text emphasizes progression from weak proof to strong proof.

#### Section: Current Solution and Market Gap
- Element A: **Alternatives / workarounds table**
- Table columns:

| Current approach | What it solves | Where it fails |
|---|---|---|

- Element B: **Workflow pain-point table**
- Table columns:

| Workflow stage | Pain point | Severity |
|---|---|---|

#### Section: Customer Fundamentals
- Element A: **Buyer roles table**
- Table columns:

| Role | Who | What they care about | Veto power |
|---|---|---|---|

- Element B: **Trigger timeline table**
- Table columns:

| Trigger | Window | Why it matters |
|---|---|---|

- Optional flow (only if section discusses timing/sequence): **Buying-process flow**
  - Flow: `Need recognized → Evaluation → Approval → Purchase`

#### Section: Key Takeaways
- 3-5 bullet points. No table.

#### Section: Risks and Next Steps
- Element: **Risk register table** (combined — one risk per one mitigation)
- Table columns:

| Risk | Probability | Severity | Mitigation / Next Step |
|---|---|---|---|

- Colour-code Probability and Severity cells per the risk colour rules above.

---

### Chapter 2: Market Research

**Chapter summary line**: "This chapter covers Key Takeaways, Risks and Mitigation strategies, Market Sizing & Structure, Trends & Growth, Value Chain & Competitive Structure, Buying Cycle & Commercial Dynamics, Policy & Regulatory Environment, and Entry Conditions & Adoption Constraints."

#### Section: Overview
- Element: **Market snapshot box** (summary box, not a table)
- Structure:
  - Market shape
  - Growth theme
  - Main constraint
  - Overall implication

#### Section: Market Sizing & Structure
This section gets 2-3 elements because it mixes definitions, filters, and sizing logic.

- Element A: **TAM / SAM / SOM summary table**
- Table columns:

| Metric / Layer | Definition | What it includes / excludes |
|---|---|---|

- Visual: **Funnel** (render using the funnel visual rules above)
  - `Universe → Filtered market → Reachable market → Realistic share`
  - This is one of the most useful visuals in any case deck.

- Element B: **Segment attractiveness table**

| Segment | Attractiveness | Why | Constraint | Recommended stance |
|---|---|---|---|---|

- Element C: **Concentration table**

| Dimension | Observation | Implication |
|---|---|---|

- Pre-populate the Dimension column with: Geography, Buyers, Market structure (add more rows if the text warrants).

#### Section: Trends & Growth
- Element A: **Trend → Implication table**

| Trend | Direction | Opportunity / Threat | Implication for Company |
|---|---|---|---|

- Optional: **Growth scenario table** (only if trajectory data exists)

| Scenario | Growth quality | Trigger |
|---|---|---|

- Optional chart: only if there is a real growth trajectory to show. Otherwise skip the chart.

#### Section: Value Chain & Competitive Structure
- Element: **Value chain flow diagram** (DEFINITELY use a visual here)
- Suggested flow: `Input / origination → Development → Delivery → Ownership / monetization`
  - Other flows are acceptable if the text suggests a different chain structure.
- Optional table: **Where-are-the-value-pools table** (only if section explains where profits, bottlenecks, or whitespace sit)

| Stage | Role in chain | Why it matters |
|---|---|---|

#### Section: Buying Cycle & Commercial Dynamics
Use 2 elements. The section should explain how mature the market is, how deals happen, and what the economics look like.

- Element 1 (anchor): **Adoption + cycle summary table**

| Dimension | Summary |
|---|---|
| Adoption stage | [extracted] |
| Typical buyer motion | [extracted] |
| Buying cycle length | [extracted] |
| Main gating events | [extracted] |
| Common failure points | [extracted] |
| Purchase format | [extracted] |

- Element 2: **Pricing / spend table**

| Topic | Benchmark / pattern |
|---|---|
| Unit spend | [extracted] |
| Portfolio spend | [extracted] |
| Budget structure | [extracted] |
| Pricing anchor | [extracted] |
| Premium pricing conditions | [extracted] |
| Nice-to-have vs must-have use cases | [extracted] |

#### Section: Policy & Regulatory Environment
- Element: **Policy / Effect table**

| Policy / platform factor | Positive or negative | Effect on market |
|---|---|---|

#### Section: Entry Conditions & Adoption Constraints
- Element: **Barriers table**

| Barrier / dependency | Why it matters | Effect on entry / adoption |
|---|---|---|

- Optional flow (only if failure at one stage blocks everything downstream):
  - Flow: `Access → Qualification → Approval → Deployment`

#### Section: Key Takeaways
- 3-5 bullet points. No table.

#### Section: Risks and Next Steps
- Element: **Risk register table**

| Risk | Probability | Severity | Mitigation / Next Step |
|---|---|---|---|

---

### Chapter 3: Competitive Analysis

**Chapter summary line**: "This chapter covers Key Takeaways, Risks and Mitigation strategies, Competitive Landscape Overview, Market Position & Share Dynamics, Defensibility & Moat Architecture, Differentiation & Right to Win, and Risk & Fragility."

#### Section: Overview
- Element: **Competitive takeaway box** (summary box, not a table)
- Purpose: Tell the reader what kind of competitive field this is, where the company stands, and what question matters most.
- No chart needed.

#### Section: Competitive Landscape Overview
- Element: **Competitor comparison matrix**

| Player | Business Model | Strength | Weakness | Threat to our Company |
|---|---|---|---|---|

- NOTE: This is NOT the big comprehensive competitor table — that goes in the appendix. Keep this to the 4-6 most relevant players.
- Optional: 2x2 positioning visual (if the text supports clear axes for comparison)

#### Section: Market Position & Share Dynamics
- Element: **Share / position table(s)** — 1-2 tables breaking players down by geography or other segmentation

| Player | Relative market share | Implication |
|---|---|---|

- Optional: bar chart showing relative shares (render as styled HTML horizontal bars, not an image)

#### Section: Defensibility & Moat Architecture
- Element A: **Moat stack table**

| Potential moat | Defensible? | Who has it today? | Can our company have it? |
|---|---|---|---|

- Element B: **Switching cost table**

| Switching cost type | Why sticky |
|---|---|

- Optional diagram (only if showing defensibility is built in layers):
  - Flow: `Foundation capabilities → Access / relationships → Operational lock-in`

#### Section: Differentiation & Right to Win
- Element: **Right-to-win matrix**

| Winning factor | Our position | Why it matters |
|---|---|---|

- No chart needed.

#### Section: Risk & Fragility
- Element: **Fragility table** — framed in terms of triggers and implications

| Fragility / risk | What could trigger it | Consequence |
|---|---|---|

- No additional diagram needed.

#### Section: Key Takeaways
- 3-5 bullet points. No table.

#### Section: Risks and Next Steps
- Element: **Risk register table**

| Risk | Probability | Severity | Mitigation / Next Step |
|---|---|---|---|

---

### Chapter 4: Executive Summary

This chapter synthesises findings from the other three chapters into a single decision-grade overview. It replaces the old "Full Summary" chapter. The Strategic Fit section (previously inside Customer and Demand Validation) is moved here.

**Chapter summary line**: "This chapter covers the overall assessment, Strategic Fit analysis, cross-chapter synthesis, Key Takeaways, and Risks and Mitigation strategies."

#### Section: Overview
- Element: **Executive assessment box** (summary box)
- Purpose: The "tell it to me straight" — a blunt, concise assessment of the opportunity. Should orient a senior decision-maker in 30 seconds.
- Structure:
  - One-line verdict / recommendation
  - Core reasoning (2-3 sentences)
  - What the reader needs to decide

#### Section: Strategic Fit
This section asks whether the customer and demand, market, regulatory, and competitor realities are actually suited to pursue the opportunity. The reader wants to compare company requirements against where the market is today.

- Element 1: **One paragraph description** of the strategic fit assessment. Direct, analytical, no filler.
- Element 2: **Strategic Fit matrix table** — this is the core element of this section.

| Company Requirement | Market and Customer Reality | Fit Level |
|---|---|---|

- 6-8 rows covering:
  - Customer demand alignment
  - Market structure fit
  - Regulatory environment alignment
  - Competitive positioning
  - Commercial dynamics fit
  - Technology / capability alignment
  - (Add 1-2 more if the text warrants)

- Fit Level values: `Strong Fit`, `Moderate Fit`, `Weak Fit`, or `Misaligned` — colour-coded per the fit level rules above.
- This section is better as a clean matrix than a visual. Do NOT add charts or diagrams here.

#### Section: Cross-Chapter Synthesis
- Element: **Chapter findings summary table** — one row per chapter

| Chapter | Core Finding | Confidence | Key Risk |
|---|---|---|---|

- 3 rows: Opportunity Validation, Market Research, Competitive Analysis
- Follow with 1-2 paragraphs of analytical synthesis connecting the threads across chapters.

#### Section: Key Takeaways
- 3-5 bullet points covering the most important findings across all chapters.

#### Section: Risks and Next Steps
- Element: **Risk register table** — synthesised across all chapters, covering the highest-priority risks

| Risk | Probability | Severity | Mitigation / Next Step |
|---|---|---|---|

---

## Implementation Notes

### Priority Order for Building

1. **API route** (`/api/enhance`) — get the OpenRouter call working end-to-end. Test with a hardcoded prompt and verify the HTML output is valid.
2. **Output renderer** — build the split-panel layout. Render the HTML in an iframe or a `dangerouslySetInnerHTML` div. Confirm copy-paste works.
3. **Copy mechanism** — implement both "Copy Rich HTML" (using `ClipboardItem` with `text/html` MIME type) and "Copy Source" (raw string). This is the most critical UX feature.
4. **Chapter selector + input panel** — build the left panel with chapter type buttons and textarea.
5. **System prompt assembly** — wire the chapter-specific guidelines into the API route. The system prompt = base output rules (Section 5) + chapter spec (Section 6).
6. **Polish** — loading states, error handling, sample text loader for testing.

### Environment Variables

```env
OPENROUTER_API_KEY=        # Required
NEXT_PUBLIC_APP_NAME=      # "Chapter Enhancer"
```

### OpenRouter Call Shape

```typescript
const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "anthropic/claude-sonnet-4-5",
    max_tokens: 8000,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Here is the executive summary / chapter draft to enhance. Transform it according to the chapter guidelines, adding all required tables, visuals, and structure. Output ONLY the HTML:\n\n${inputText}` },
    ],
  }),
});
```

### File Size / Input Limits

- Minimum input: 100 characters (reject with helpful error)
- Maximum input: 50,000 characters (reject with helpful error — suggest splitting into sections)
- Server-side validation in the API route

### Testing

Include a "Load sample" button for each chapter type that populates the input with realistic sample text. This is essential for development and demos. Samples should be 300-500 words of plausible investment memo content for each chapter type.

---

## What This Tool Does NOT Do

- Does not store any data (no database, no history)
- Does not handle authentication
- Does not generate images or charts as image files — all visuals are styled HTML
- Does not modify the original text — it produces new enhanced output
- Does not handle file uploads (PDF/Excel) — input is pasted text only
- Does not produce the Olsenator infographic — that is a separate tool
