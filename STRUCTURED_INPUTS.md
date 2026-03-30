# Structured Visual Input

This builder supports two input paths:

- `Chapter Text`: the existing prose extraction workflow for general visual discovery.
- `Structured JSON`: the preferred workflow for upstream-produced `risk_matrix` and `strategic_fit_scalability` payloads.

## Boundary

- The image builder renders visuals.
- The upstream system owns score derivation, risk extraction, and score consistency across memo sections.
- When `scoring_rationale` is supplied, the builder validates that plotted `x` and `y` values still equal `score * 10`.
- The builder does not recompute or "fix" scores. Inconsistent structured payloads fail validation.

## API

`POST /api/ingest-structured-visuals`

Request body:

```json
{
  "risk_matrix": { "...": "..." },
  "strategic_fit_scalability": { "...": "..." }
}
```

Either top-level key may be omitted, but at least one is required.
