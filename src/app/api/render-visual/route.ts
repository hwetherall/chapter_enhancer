import { NextRequest, NextResponse } from "next/server";
import { requestOpenRouterText } from "@/lib/openrouter";
import { buildRenderingUserPrompt, RENDERING_SYSTEM_PROMPT } from "@/lib/rendering-prompt";
import type { VisualSpec } from "@/lib/visual-types";

const PRIMARY_MODEL = "anthropic/claude-opus-4-6";
const FALLBACK_MODEL = "anthropic/claude-sonnet-4-5";

function isVisualSpec(value: unknown): value is VisualSpec {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.type === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.targetSection === "string" &&
    !!candidate.data &&
    typeof candidate.data === "object"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const spec = body?.spec;

    if (!isVisualSpec(spec)) {
      return NextResponse.json({ error: "Invalid visual specification." }, { status: 400 });
    }

    if (spec.type === "scorecard") {
      return NextResponse.json(
        { error: "Scorecards are rendered deterministically." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key is not configured." },
        { status: 500 }
      );
    }

    const response = await requestOpenRouterText({
      apiKey,
      systemPrompt: RENDERING_SYSTEM_PROMPT,
      userPrompt: buildRenderingUserPrompt(spec),
      maxTokens: 12000,
      primaryModel: PRIMARY_MODEL,
      fallbackModel: FALLBACK_MODEL,
    });

    const html = response.content.trim().replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/, "");

    if (!html || !html.includes("<div")) {
      return NextResponse.json(
        { error: "AI returned invalid HTML." },
        { status: 502 }
      );
    }

    return NextResponse.json({ html, model: response.model });
  } catch (error) {
    console.error("Render visual error:", error);
    return NextResponse.json(
      { error: "Render failed. Click Regenerate to try again." },
      { status: 502 }
    );
  }
}
