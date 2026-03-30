# Optimal Input Specification for Visual Generation

This document describes the ideal structured output that the **upstream generation tool** (the Innovera platform agent) should produce so that the image builder can render Risk Matrix and Strategic Fit vs Scalability visuals without ambiguity or data loss.

---

## 1. Risk Matrix — Ideal Input

### What the image builder needs

A flat list of risks, each classified on two categorical axes (Probability and Severity), with a short label and a stable ID.

### Recommended upstream output format

```json
{
  "visual_type": "risk_matrix",
  "title": "Key Risks — Executive Summary",
  "caption": "Top risks aggregated across Opportunity Validation, Market Research, and Competitive Analysis",
  "insight": "Two critical risks (no commercial validation, competitive timeline compression) dominate the top-right quadrant and must be addressed before proceeding to pilot.",
  "data": {
    "risks": [
      {
        "id": "1",
        "label": "No commercial validation exists",
        "probability": "High",
        "severity": "High",
        "mitigation": "Secure 3 paid LOIs within 90 days",
        "source_chapter": "Opportunity Validation"
      },
      {
        "id": "2",
        "label": "AppFolio AI acquisition accelerates timeline",
        "probability": "Medium",
        "severity": "High",
        "mitigation": "Build predictive data advantage with early customers",
        "source_chapter": "Competitive Analysis"
      }
    ]
  }
}
```

### Field-by-field guidance

| Field | Required | Constraints | Notes |
|-------|----------|-------------|-------|
| `id` | Yes | String, unique, sequential ("1", "2", ...) | Displayed inside the pip on the matrix. Keep short. |
| `label` | Yes | Max 40 characters | Shown in the legend below the matrix. Truncated if longer. |
| `probability` | Yes | Exactly one of: `"Low"`, `"Medium"`, `"High"` | No numeric scores — the matrix is categorical. |
| `severity` | Yes | Exactly one of: `"Low"`, `"Medium"`, `"High"` | Same constraint. Use "severity" not "impact". |
| `mitigation` | Optional | Free text | Not rendered on the visual but useful for the document narrative. |
| `source_chapter` | Optional | Chapter name | Helps with traceability in the Executive Summary aggregation. |

### Best practices for the upstream tool

1. **Cap at 9 risks.** The 3×3 grid has 9 cells. More than 9 risks creates visual clutter. If there are more, rank and select the top 9 by combined severity.

2. **Distribute meaningfully.** If every risk is "High–High", the matrix loses its value. Challenge the scoring — are all risks truly high probability AND high severity? Push borderline cases to Medium.

3. **Avoid duplicates across chapters.** When building the Executive Summary risk matrix, deduplicate risks that appear in multiple chapters. Pick the highest severity/probability rating if they differ.

4. **Keep labels actionable.** "Market risk" is too vague. "Pricing pressure from AppFolio's $1.50/unit floor" is specific enough to act on.

5. **Pair with the `insight` field.** A one-line analytical takeaway (e.g., "Two critical risks cluster in the top-right quadrant") gives the reader an immediate interpretation.

---

## 2. Strategic Fit vs Scalability — Ideal Input

### What the image builder needs

One or more scored items positioned on a continuous 2D plane (0–100 on each axis), with axis labels and quadrant names.

### Recommended upstream output format

#### Single-opportunity assessment (Executive Summary)

```json
{
  "visual_type": "two_by_two",
  "title": "Strategic Fit vs Scalability",
  "caption": "Opportunity positioning based on cross-chapter analysis",
  "insight": "The opportunity shows strong strategic fit but constrained scalability, suggesting a niche play that requires careful ROI evaluation.",
  "data": {
    "xAxis": {
      "label": "Strategic Fit",
      "lowLabel": "Weak Fit",
      "highLabel": "Strong Fit"
    },
    "yAxis": {
      "label": "Scalability",
      "lowLabel": "Constrained",
      "highLabel": "Highly Scalable"
    },
    "items": [
      {
        "label": "PropMgmt Software",
        "x": 70,
        "y": 30,
        "size": 20,
        "color": "#2563eb"
      }
    ],
    "quadrantLabels": {
      "topLeft": "Pivot Candidate",
      "topRight": "Ideal",
      "bottomLeft": "Pass",
      "bottomRight": "Niche Play"
    },
    "scoring_rationale": {
      "strategic_fit": {
        "score": 7,
        "breakdown": {
          "customer_demand_alignment": 6,
          "market_structure_fit": 8,
          "regulatory_alignment": 8,
          "competitive_positioning": 6,
          "commercial_dynamics_fit": 8,
          "technology_capability": 7,
          "talent_alignment": 6
        },
        "summary": "Strong market and regulatory alignment offset by unvalidated commercial demand and moderate talent gaps."
      },
      "scalability": {
        "score": 3,
        "breakdown": {
          "unit_economics": 4,
          "market_size_ceiling": 7,
          "operational_leverage": 2,
          "geographic_expandability": 2,
          "network_effects_potential": 3
        },
        "summary": "Large addressable market but constrained by high CAC, integration complexity, and need for localised operations."
      }
    }
  }
}
```

#### Multi-opportunity comparison (Full Summary / Alternative Business Models)

```json
{
  "visual_type": "two_by_two",
  "title": "Alternative Business Model Positioning",
  "caption": "Comparative strategic fit and scalability across recommended business models",
  "insight": "The SaaS platform model scores highest on both dimensions. The marketplace model trades fit for scalability.",
  "data": {
    "xAxis": {
      "label": "Strategic Fit",
      "lowLabel": "Weak Fit",
      "highLabel": "Strong Fit"
    },
    "yAxis": {
      "label": "Scalability",
      "lowLabel": "Constrained",
      "highLabel": "Highly Scalable"
    },
    "items": [
      {
        "label": "SaaS Platform",
        "x": 75,
        "y": 60,
        "size": 22,
        "color": "#059669"
      },
      {
        "label": "Marketplace Model",
        "x": 40,
        "y": 80,
        "size": 18,
        "color": "#2563eb"
      },
      {
        "label": "Consulting + License",
        "x": 80,
        "y": 25,
        "size": 16,
        "color": "#d97706"
      }
    ],
    "quadrantLabels": {
      "topLeft": "Pivot Candidate",
      "topRight": "Ideal",
      "bottomLeft": "Pass",
      "bottomRight": "Niche Play"
    }
  }
}
```

### Field-by-field guidance

| Field | Required | Constraints | Notes |
|-------|----------|-------------|-------|
| `x` | Yes | Integer 0–100 | Maps from a 0–10 score (multiply by 10). Represents Strategic Fit. |
| `y` | Yes | Integer 0–100 | Maps from a 0–10 score (multiply by 10). Represents Scalability. |
| `label` | Yes | Max 20 characters | Displayed below the dot. Keep concise. |
| `size` | Optional | 12–24 (px) | Bubble radius. Use to encode a third dimension (e.g., confidence level, investment size). Default: 18. |
| `color` | Optional | Hex colour string | Defaults to palette cycling. Useful when plotting multiple items to distinguish them. |
| `quadrantLabels` | Yes | Four strings | Keep to 2–3 words each. These appear as faint watermarks in each quadrant. |
| `scoring_rationale` | Optional | See structure above | Not rendered on the visual. Provides auditability and helps resolve score inconsistencies. |

### Scoring methodology — recommended sub-dimensions

To produce consistent, defensible scores, the upstream tool should score these sub-dimensions and average them.

#### Strategic Fit (X-axis) — score each 1–10, then average

| Sub-dimension | What it measures |
|---------------|-----------------|
| Customer Demand Alignment | Does the target customer match the client's existing customer base or adjacency? |
| Market Structure Fit | Does the market structure (fragmented, consolidated, etc.) favour the client's go-to-market model? |
| Regulatory Alignment | Do regulatory tailwinds or compliance requirements create pull for the offering? |
| Competitive Positioning | Can the client credibly differentiate given the competitive landscape? |
| Commercial Dynamics Fit | Do pricing, contract structures, and buying cycles match the client's sales motion? |
| Technology / Capability Alignment | Does the client have (or can quickly build) the required technology stack? |
| Talent Alignment | Does the client have access to the required talent? |

#### Scalability (Y-axis) — score each 1–10, then average

| Sub-dimension | What it measures |
|---------------|-----------------|
| Unit Economics | Do per-unit margins improve with scale? |
| Market Size Ceiling | Is the addressable market large enough to support 10× growth? |
| Operational Leverage | Can the business grow without proportional headcount or cost increases? |
| Geographic Expandability | Can the model be replicated in new geographies without significant rework? |
| Network Effects Potential | Does the product become more valuable as more users adopt it? |

### Best practices for the upstream tool

1. **Score once, use everywhere.** The biggest issue flagged in testing is score inconsistency across sections (Executive Summary: 7/10, Full Summary: 8/10, 6-T Analysis: 8/10 for the same dimension). The upstream tool should compute Strategic Fit and Scalability scores **once** from the underlying sub-dimension scores and reference that single result across all document sections.

2. **Include the `scoring_rationale` object.** Even though it's not rendered on the visual, it makes the score auditable. If a reviewer questions why Scalability is 3/10, the breakdown shows exactly which sub-dimensions dragged it down.

3. **Map scores to positions honestly.** `x` and `y` should be `score × 10`. Don't manually nudge positions to look better on the chart — the quadrant placement is the whole point.

4. **Use the multi-item format for alternatives.** When Nobu's alternative business model recommendations are included, plot each alternative as a separate item on the same grid. This makes trade-offs immediately visible (e.g., "the marketplace model scales better but fits worse").

5. **Cap at 5 items per chart.** Beyond 5 dots, the labels overlap and the chart becomes unreadable. If comparing more alternatives, select the top 5 by combined score or group similar ones.

6. **Use `size` to encode confidence.** If one score is based on validated data and another on assumptions, make the validated one a larger bubble (size: 22) and the assumed one smaller (size: 14). This adds a useful third dimension without cluttering the chart.

---

## Summary: Minimum Viable Input

For the image builder to render correctly, the absolute minimum input is:

### Risk Matrix

```json
{
  "risks": [
    { "id": "1", "label": "Risk description", "probability": "High", "severity": "High" }
  ]
}
```

### Strategic Fit vs Scalability

```json
{
  "xAxis": { "label": "Strategic Fit", "lowLabel": "Weak Fit", "highLabel": "Strong Fit" },
  "yAxis": { "label": "Scalability", "lowLabel": "Constrained", "highLabel": "Highly Scalable" },
  "items": [{ "label": "Opportunity", "x": 70, "y": 30 }],
  "quadrantLabels": { "topLeft": "Pivot Candidate", "topRight": "Ideal", "bottomLeft": "Pass", "bottomRight": "Niche Play" }
}
```

Everything else (caption, insight, scoring_rationale, mitigation, source_chapter) enriches the output but is not required for rendering.
