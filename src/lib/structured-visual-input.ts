import type {
  StructuredVisualInputPayload,
  UpstreamRiskMatrixPayload,
  UpstreamRiskMatrixRisk,
  UpstreamStrategicFitScalabilityPayload,
  VisualSpec,
} from "@/lib/visual-types";

const RISK_LEVELS = ["Low", "Medium", "High"] as const;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function expectRecord(value: unknown, fieldName: string): Record<string, unknown> {
  assert(isRecord(value), `${fieldName} must be an object.`);
  return value;
}

function expectString(value: unknown, fieldName: string): string {
  assert(isNonEmptyString(value), `${fieldName} is required.`);
  return value.trim();
}

function expectOptionalString(value: unknown, fieldName: string): string | undefined {
  assert(
    value === undefined || typeof value === "string",
    `${fieldName} must be a string when provided.`
  );
  return typeof value === "string" ? value.trim() : undefined;
}

function expectRiskLevel(
  value: unknown,
  fieldName: string
): (typeof RISK_LEVELS)[number] {
  assert(
    typeof value === "string" &&
      RISK_LEVELS.includes(value as (typeof RISK_LEVELS)[number]),
    `${fieldName} must be Low, Medium, or High.`
  );
  return value as (typeof RISK_LEVELS)[number];
}

function expectInteger(value: unknown, fieldName: string, min: number, max: number): number {
  assert(
    typeof value === "number" &&
      Number.isInteger(value) &&
      value >= min &&
      value <= max,
    `${fieldName} must be an integer from ${min} to ${max}.`
  );
  return value;
}

function getArrayOrWrappedSingle(value: unknown, fieldName: string) {
  if (Array.isArray(value)) {
    return value;
  }

  if (isRecord(value)) {
    return [value];
  }

  throw new Error(`${fieldName} must be an array or a single object.`);
}

function humanizeSnakeCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function looksLikeBareRiskArray(value: unknown): value is unknown[] {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }

  const first = value[0];
  if (!isRecord(first)) {
    return false;
  }

  return (
    ("risk_id" in first || "id" in first) &&
    ("probability" in first || "severity" in first)
  );
}

function wrapBareRiskArray(risks: unknown[]): Record<string, unknown> {
  return {
    risk_matrix: {
      title: "Risk Matrix",
      data: { risks },
    },
  };
}

function toStructuredPayloadShape(payload: unknown): Record<string, unknown> {
  if (looksLikeBareRiskArray(payload)) {
    return wrapBareRiskArray(payload);
  }

  const candidate = expectRecord(payload, "Structured visual input");

  if ("risk_matrix" in candidate || "strategic_fit_scalability" in candidate) {
    return candidate;
  }

  if (candidate.visual_type === "risk_matrix") {
    return { risk_matrix: candidate };
  }

  if (candidate.visual_type === "two_by_two") {
    return { strategic_fit_scalability: candidate };
  }

  if (Array.isArray(candidate.risks) && looksLikeBareRiskArray(candidate.risks)) {
    return { risk_matrix: { title: "Risk Matrix", data: { risks: candidate.risks } } };
  }

  if (looksLikeScoreDimensions(candidate)) {
    return { strategic_fit_scalability: candidate };
  }

  return candidate;
}

function parseRisk(risk: unknown, index: number): UpstreamRiskMatrixRisk {
  const candidate = expectRecord(risk, `risk_matrix.data.risks[${index}]`);

  const rawId = candidate.id ?? candidate.risk_id;
  const id = expectString(rawId, `risk_matrix.data.risks[${index}].id (or risk_id)`);

  const rawLabel = candidate.label ?? candidate.caption;
  let label: string;
  if (isNonEmptyString(rawLabel)) {
    label = rawLabel.trim();
  } else {
    label = humanizeSnakeCase(id);
  }
  if (label.length > 40) {
    label = label.slice(0, 37) + "...";
  }

  return {
    id: String(index + 1),
    label,
    probability: expectRiskLevel(
      candidate.probability,
      `risk_matrix.data.risks[${index}].probability`
    ),
    severity: expectRiskLevel(
      candidate.severity,
      `risk_matrix.data.risks[${index}].severity`
    ),
    mitigation: expectOptionalString(
      candidate.mitigation,
      `risk_matrix.data.risks[${index}].mitigation`
    ),
    source_chapter: expectOptionalString(
      candidate.source_chapter,
      `risk_matrix.data.risks[${index}].source_chapter`
    ),
  };
}

function parseRiskMatrix(input: unknown): UpstreamRiskMatrixPayload {
  const candidate = expectRecord(input, "risk_matrix");
  assert(
    candidate.visual_type === undefined || candidate.visual_type === "risk_matrix",
    'risk_matrix.visual_type must be "risk_matrix" when provided.'
  );
  const data = expectRecord(candidate.data, "risk_matrix.data");
  const risks = getArrayOrWrappedSingle(data.risks, "risk_matrix.data.risks");
  assert(risks.length > 0, "risk_matrix.data.risks must contain at least one risk.");
  assert(risks.length <= 9, "risk_matrix.data.risks cannot contain more than 9 risks.");

  const title = isNonEmptyString(candidate.title)
    ? candidate.title.trim()
    : "Risk Matrix";

  return {
    visual_type: "risk_matrix",
    title,
    caption: expectOptionalString(candidate.caption, "risk_matrix.caption"),
    insight: expectOptionalString(candidate.insight, "risk_matrix.insight"),
    data: {
      risks: risks.map(parseRisk),
    },
  };
}

function parseAxisConfig(
  value: unknown,
  fieldName: string,
  defaultLabel: string
): { label: string; lowLabel: string; highLabel: string } {
  if (isRecord(value)) {
    return {
      label: expectString(value.label, `${fieldName}.label`),
      lowLabel: expectString(value.lowLabel, `${fieldName}.lowLabel`),
      highLabel: expectString(value.highLabel, `${fieldName}.highLabel`),
    };
  }

  if (isNonEmptyString(value)) {
    const parts = value
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 2) {
      return {
        label: defaultLabel,
        lowLabel: parts[0],
        highLabel: parts[1],
      };
    }

    if (parts.length === 3) {
      return {
        label: parts[0],
        lowLabel: parts[1],
        highLabel: parts[2],
      };
    }
  }

  throw new Error(
    `${fieldName} must be an axis object or a shorthand string like "Weak Fit / Strong Fit".`
  );
}

function buildNeutralStrategicFitBreakdown() {
  return {
    customer_demand_alignment: 5,
    market_structure_fit: 5,
    regulatory_alignment: 5,
    competitive_positioning: 5,
    commercial_dynamics_fit: 5,
    technology_capability: 5,
    talent_alignment: 5,
  };
}

function buildNeutralScalabilityBreakdown() {
  return {
    unit_economics: 5,
    market_size_ceiling: 5,
    operational_leverage: 5,
    geographic_expandability: 5,
    network_effects_potential: 5,
  };
}

function extractScoreFromText(text: string): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)\s*(?:out of 10|\/10)/i);
  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  const rounded = Math.round(parsed);
  return rounded >= 1 && rounded <= 10 ? rounded : null;
}

function parseStrategicFitDimension(
  value: unknown,
  fallbackScore: number,
  fieldName: string
) {
  if (typeof value === "string") {
    const score = extractScoreFromText(value) ?? fallbackScore;
    assert(score >= 1 && score <= 10, `${fieldName} must resolve to a score from 1 to 10.`);

    return {
      score,
      breakdown: buildNeutralStrategicFitBreakdown(),
      summary: value.trim(),
    };
  }

  const candidate = expectRecord(value, fieldName);
  const score = expectInteger(candidate.score, `${fieldName}.score`, 1, 10);

  if (candidate.breakdown === undefined) {
    return {
      score,
      breakdown: buildNeutralStrategicFitBreakdown(),
      summary: expectString(
        candidate.summary ?? candidate.rationale,
        `${fieldName}.summary`
      ),
    };
  }

  const breakdown = expectRecord(candidate.breakdown, `${fieldName}.breakdown`);
  const summary = expectString(
    candidate.summary ?? candidate.rationale,
    `${fieldName}.summary`
  );

  return {
    score,
    breakdown: {
      customer_demand_alignment: expectInteger(
        breakdown.customer_demand_alignment,
        `${fieldName}.breakdown.customer_demand_alignment`,
        1,
        10
      ),
      market_structure_fit: expectInteger(
        breakdown.market_structure_fit,
        `${fieldName}.breakdown.market_structure_fit`,
        1,
        10
      ),
      regulatory_alignment: expectInteger(
        breakdown.regulatory_alignment,
        `${fieldName}.breakdown.regulatory_alignment`,
        1,
        10
      ),
      competitive_positioning: expectInteger(
        breakdown.competitive_positioning,
        `${fieldName}.breakdown.competitive_positioning`,
        1,
        10
      ),
      commercial_dynamics_fit: expectInteger(
        breakdown.commercial_dynamics_fit,
        `${fieldName}.breakdown.commercial_dynamics_fit`,
        1,
        10
      ),
      technology_capability: expectInteger(
        breakdown.technology_capability,
        `${fieldName}.breakdown.technology_capability`,
        1,
        10
      ),
      talent_alignment: expectInteger(
        breakdown.talent_alignment,
        `${fieldName}.breakdown.talent_alignment`,
        1,
        10
      ),
    },
    summary,
  };
}

function parseScalabilityDimension(
  value: unknown,
  fallbackScore: number,
  fieldName: string
) {
  if (typeof value === "string") {
    const score = extractScoreFromText(value) ?? fallbackScore;
    assert(score >= 1 && score <= 10, `${fieldName} must resolve to a score from 1 to 10.`);

    return {
      score,
      breakdown: buildNeutralScalabilityBreakdown(),
      summary: value.trim(),
    };
  }

  const candidate = expectRecord(value, fieldName);
  const score = expectInteger(candidate.score, `${fieldName}.score`, 1, 10);

  if (candidate.breakdown === undefined) {
    return {
      score,
      breakdown: buildNeutralScalabilityBreakdown(),
      summary: expectString(
        candidate.summary ?? candidate.rationale,
        `${fieldName}.summary`
      ),
    };
  }

  const breakdown = expectRecord(candidate.breakdown, `${fieldName}.breakdown`);
  const summary = expectString(
    candidate.summary ?? candidate.rationale,
    `${fieldName}.summary`
  );

  return {
    score,
    breakdown: {
      unit_economics: expectInteger(
        breakdown.unit_economics,
        `${fieldName}.breakdown.unit_economics`,
        1,
        10
      ),
      market_size_ceiling: expectInteger(
        breakdown.market_size_ceiling,
        `${fieldName}.breakdown.market_size_ceiling`,
        1,
        10
      ),
      operational_leverage: expectInteger(
        breakdown.operational_leverage,
        `${fieldName}.breakdown.operational_leverage`,
        1,
        10
      ),
      geographic_expandability: expectInteger(
        breakdown.geographic_expandability,
        `${fieldName}.breakdown.geographic_expandability`,
        1,
        10
      ),
      network_effects_potential: expectInteger(
        breakdown.network_effects_potential,
        `${fieldName}.breakdown.network_effects_potential`,
        1,
        10
      ),
    },
    summary,
  };
}

function parseScoringRationale(
  rationale: unknown,
  firstItem: { x: number; y: number }
): NonNullable<UpstreamStrategicFitScalabilityPayload["data"]["scoring_rationale"]> {
  const candidate = expectRecord(
    rationale,
    "strategic_fit_scalability.data.scoring_rationale"
  );

  const fallbackStrategicFitScore = Math.round(firstItem.x / 10);
  const fallbackScalabilityScore = Math.round(firstItem.y / 10);

  const strategicFit = parseStrategicFitDimension(
    candidate.strategic_fit,
    fallbackStrategicFitScore,
    "strategic_fit_scalability.data.scoring_rationale.strategic_fit"
  );
  const scalability = parseScalabilityDimension(
    candidate.scalability,
    fallbackScalabilityScore,
    "strategic_fit_scalability.data.scoring_rationale.scalability"
  );

  assert(
    firstItem.x === strategicFit.score * 10,
    "strategic_fit_scalability.data.items[0].x must equal strategic_fit score x 10."
  );
  assert(
    firstItem.y === scalability.score * 10,
    "strategic_fit_scalability.data.items[0].y must equal scalability score x 10."
  );

  return {
    strategic_fit: strategicFit,
    scalability,
  };
}

const DEFAULT_AXIS_CONFIG = {
  xAxis: { label: "Strategic Fit", lowLabel: "Weak Fit", highLabel: "Strong Fit" },
  yAxis: { label: "Scalability", lowLabel: "Constrained", highLabel: "Highly Scalable" },
};

const DEFAULT_QUADRANT_LABELS = {
  topLeft: "Pivot Candidate",
  topRight: "Ideal",
  bottomLeft: "Pass",
  bottomRight: "Niche Play",
};

function looksLikeScoreDimensions(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  const hasStrategicFit =
    isRecord(value.strategic_fit) || isRecord(value.strategic_opportunity_validation);
  const hasScalability =
    isRecord(value.scalability) || isRecord(value.capability_fit_validation) || isRecord(value.capability_fit);

  return hasStrategicFit || hasScalability;
}

function extractScoreDimension(
  value: unknown,
  fieldName: string
): { score: number; summary: string } | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (isRecord(value)) {
    const rawScore = value.score;
    if (typeof rawScore === "number" && rawScore >= 1 && rawScore <= 10) {
      const summary =
        isNonEmptyString(value.summary)
          ? value.summary.trim()
          : isNonEmptyString(value.rationale)
            ? value.rationale.trim()
            : isNonEmptyString(value.description)
              ? value.description.trim()
              : `Score: ${rawScore}`;
      return { score: Math.round(rawScore), summary };
    }
  }

  if (typeof value === "string") {
    const score = extractScoreFromText(value);
    if (score !== null) {
      return { score, summary: value.trim() };
    }
  }

  return null;
}

function buildFromScoreDimensions(
  candidate: Record<string, unknown>,
  label: string
): UpstreamStrategicFitScalabilityPayload {
  const fitSource =
    candidate.strategic_fit ??
    candidate.strategic_opportunity_validation ??
    candidate.market_fit;
  const scaleSource =
    candidate.scalability ??
    candidate.capability_fit_validation ??
    candidate.capability_fit;

  const fitDim = extractScoreDimension(fitSource, "strategic_fit");
  const scaleDim = extractScoreDimension(scaleSource, "scalability");

  assert(
    fitDim || scaleDim,
    "At least one scoring dimension (strategic_fit or scalability) must have a recoverable score."
  );

  const fitScore = fitDim?.score ?? 5;
  const scaleScore = scaleDim?.score ?? 5;

  return {
    visual_type: "two_by_two",
    title: isNonEmptyString(candidate.title)
      ? candidate.title.trim()
      : "Strategic Fit vs Scalability",
    caption: expectOptionalString(candidate.caption, "strategic_fit_scalability.caption"),
    insight: expectOptionalString(candidate.insight, "strategic_fit_scalability.insight"),
    data: {
      xAxis: DEFAULT_AXIS_CONFIG.xAxis,
      yAxis: DEFAULT_AXIS_CONFIG.yAxis,
      items: [
        {
          label,
          x: fitScore * 10,
          y: scaleScore * 10,
        },
      ],
      quadrantLabels: DEFAULT_QUADRANT_LABELS,
      scoring_rationale: {
        strategic_fit: {
          score: fitScore,
          breakdown: buildNeutralStrategicFitBreakdown(),
          summary: fitDim?.summary ?? `Strategic Fit score: ${fitScore}`,
        },
        scalability: {
          score: scaleScore,
          breakdown: buildNeutralScalabilityBreakdown(),
          summary: scaleDim?.summary ?? `Scalability score: ${scaleScore}`,
        },
      },
    },
  };
}

function parseStrategicFitScalability(
  input: unknown
): UpstreamStrategicFitScalabilityPayload {
  const candidate = expectRecord(input, "strategic_fit_scalability");

  if (looksLikeScoreDimensions(candidate)) {
    const label = isNonEmptyString(candidate.label)
      ? candidate.label.trim()
      : "Opportunity";
    return buildFromScoreDimensions(candidate, label);
  }

  if (looksLikeScoreDimensions(candidate.data)) {
    const label = isNonEmptyString(candidate.label)
      ? candidate.label.trim()
      : "Opportunity";
    const merged = { ...candidate, ...(candidate.data as Record<string, unknown>) };
    return buildFromScoreDimensions(merged, label);
  }

  assert(
    candidate.visual_type === undefined || candidate.visual_type === "two_by_two",
    'strategic_fit_scalability.visual_type must be "two_by_two" when provided.'
  );

  const data = expectRecord(candidate.data, "strategic_fit_scalability.data");
  const items = getArrayOrWrappedSingle(
    data.items,
    "strategic_fit_scalability.data.items"
  );
  assert(
    items.length > 0,
    "strategic_fit_scalability.data.items must contain at least one item."
  );
  assert(
    items.length <= 5,
    "strategic_fit_scalability.data.items cannot contain more than 5 items."
  );

  const parsedItems = items.map((item, index) => {
    const candidateItem = expectRecord(
      item,
      `strategic_fit_scalability.data.items[${index}]`
    );
    const label = expectString(
      candidateItem.label,
      `strategic_fit_scalability.data.items[${index}].label`
    );

    const size =
      candidateItem.size === undefined
        ? undefined
        : expectInteger(
            candidateItem.size,
            `strategic_fit_scalability.data.items[${index}].size`,
            12,
            24
          );

    const color = expectOptionalString(
      candidateItem.color,
      `strategic_fit_scalability.data.items[${index}].color`
    );
    assert(
      color === undefined || HEX_COLOR_PATTERN.test(color),
      `strategic_fit_scalability.data.items[${index}].color must be a 6-digit hex color when provided.`
    );

    return {
      label,
      x: expectInteger(
        candidateItem.x,
        `strategic_fit_scalability.data.items[${index}].x`,
        0,
        100
      ),
      y: expectInteger(
        candidateItem.y,
        `strategic_fit_scalability.data.items[${index}].y`,
        0,
        100
      ),
      size,
      color,
    };
  });

  const title = isNonEmptyString(candidate.title)
    ? candidate.title.trim()
    : "Strategic Fit vs Scalability";

  const xAxis = data.xAxis !== undefined
    ? parseAxisConfig(data.xAxis, "strategic_fit_scalability.data.xAxis", "Strategic Fit")
    : DEFAULT_AXIS_CONFIG.xAxis;

  const yAxis = data.yAxis !== undefined
    ? parseAxisConfig(data.yAxis, "strategic_fit_scalability.data.yAxis", "Scalability")
    : DEFAULT_AXIS_CONFIG.yAxis;

  const quadrantLabels = data.quadrantLabels !== undefined
    ? {
        topLeft: expectString(
          expectRecord(data.quadrantLabels, "strategic_fit_scalability.data.quadrantLabels")
            .topLeft,
          "strategic_fit_scalability.data.quadrantLabels.topLeft"
        ),
        topRight: expectString(
          expectRecord(data.quadrantLabels, "strategic_fit_scalability.data.quadrantLabels")
            .topRight,
          "strategic_fit_scalability.data.quadrantLabels.topRight"
        ),
        bottomLeft: expectString(
          expectRecord(data.quadrantLabels, "strategic_fit_scalability.data.quadrantLabels")
            .bottomLeft,
          "strategic_fit_scalability.data.quadrantLabels.bottomLeft"
        ),
        bottomRight: expectString(
          expectRecord(data.quadrantLabels, "strategic_fit_scalability.data.quadrantLabels")
            .bottomRight,
          "strategic_fit_scalability.data.quadrantLabels.bottomRight"
        ),
      }
    : DEFAULT_QUADRANT_LABELS;

  return {
    visual_type: "two_by_two",
    title,
    caption: expectOptionalString(
      candidate.caption,
      "strategic_fit_scalability.caption"
    ),
    insight: expectOptionalString(
      candidate.insight,
      "strategic_fit_scalability.insight"
    ),
    data: {
      xAxis,
      yAxis,
      items: parsedItems,
      quadrantLabels,
      scoring_rationale:
        data.scoring_rationale === undefined
          ? undefined
          : parseScoringRationale(data.scoring_rationale, parsedItems[0]),
    },
  };
}

export function validateStructuredVisualInput(
  payload: unknown
): StructuredVisualInputPayload {
  const candidate = toStructuredPayloadShape(payload);

  const riskMatrix =
    candidate.risk_matrix === undefined
      ? undefined
      : parseRiskMatrix(candidate.risk_matrix);
  const strategicFitScalability =
    candidate.strategic_fit_scalability === undefined
      ? undefined
      : parseStrategicFitScalability(candidate.strategic_fit_scalability);

  assert(
    riskMatrix || strategicFitScalability,
    'Structured visual input must include at least one of "risk_matrix" or "strategic_fit_scalability".'
  );

  return {
    risk_matrix: riskMatrix,
    strategic_fit_scalability: strategicFitScalability,
  };
}

export function normalizeStructuredVisualInput(
  payload: StructuredVisualInputPayload
): VisualSpec[] {
  const visuals: VisualSpec[] = [];

  if (payload.risk_matrix) {
    visuals.push({
      id: "v1",
      type: "risk_matrix",
      title: payload.risk_matrix.title,
      targetSection: "Structured Input",
      caption: payload.risk_matrix.caption,
      insight: payload.risk_matrix.insight,
      data: {
        risks: payload.risk_matrix.data.risks.map((risk) => ({
          id: risk.id,
          label: risk.label,
          probability: risk.probability,
          severity: risk.severity,
        })),
      },
    });
  }

  if (payload.strategic_fit_scalability) {
    visuals.push({
      id: `v${visuals.length + 1}`,
      type: "two_by_two",
      title: payload.strategic_fit_scalability.title,
      targetSection: "Structured Input",
      caption: payload.strategic_fit_scalability.caption,
      insight: payload.strategic_fit_scalability.insight,
      data: {
        xAxis: payload.strategic_fit_scalability.data.xAxis,
        yAxis: payload.strategic_fit_scalability.data.yAxis,
        items: payload.strategic_fit_scalability.data.items,
        quadrantLabels: payload.strategic_fit_scalability.data.quadrantLabels,
      },
    });
  }

  return visuals;
}
