import { NextRequest, NextResponse } from "next/server";
import { requestOpenRouterText } from "@/lib/openrouter";
import {
  normalizeStructuredVisualInput,
  validateStructuredVisualInput,
} from "@/lib/structured-visual-input";
import { STRUCTURED_INPUT_CLEANING_PROMPT } from "@/lib/structured-input-cleaning-prompt";

const PRIMARY_MODEL = "anthropic/claude-opus-4-6";
const FALLBACK_MODEL = "anthropic/claude-sonnet-4-5";

function parseJsonContent(content: string): unknown {
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(trimmed);
}

async function cleanStructuredInputWithAi(rawInput: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Structured input could not be parsed locally, and AI cleanup is unavailable because OPENROUTER_API_KEY is not configured."
    );
  }

  const response = await requestOpenRouterText({
    apiKey,
    systemPrompt: STRUCTURED_INPUT_CLEANING_PROMPT,
    userPrompt: `Clean this structured visual input into valid canonical JSON:\n\n${rawInput}`,
    maxTokens: 6000,
    primaryModel: PRIMARY_MODEL,
    fallbackModel: FALLBACK_MODEL,
  });

  return {
    parsed: parseJsonContent(response.content),
    model: response.model,
  };
}

export async function POST(request: NextRequest) {
  let rawInput = "";

  try {
    rawInput = (await request.text()).trim();
    if (!rawInput) {
      return NextResponse.json(
        { error: "Structured input is required." },
        { status: 400 }
      );
    }

    try {
      const parsed = parseJsonContent(rawInput);
      const payload = validateStructuredVisualInput(parsed);
      const visuals = normalizeStructuredVisualInput(payload);

      return NextResponse.json({ visuals, cleaned: false });
    } catch (localError) {
      const cleaned = await cleanStructuredInputWithAi(rawInput);
      const payload = validateStructuredVisualInput(cleaned.parsed);
      const visuals = normalizeStructuredVisualInput(payload);

      return NextResponse.json({
        visuals,
        cleaned: true,
        model: cleaned.model,
        warning:
          localError instanceof Error
            ? `Input was auto-cleaned before rendering: ${localError.message}`
            : "Input was auto-cleaned before rendering.",
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Structured visual ingestion failed.",
      },
      { status: 400 }
    );
  }
}
