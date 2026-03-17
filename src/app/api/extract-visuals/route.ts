import { NextRequest, NextResponse } from "next/server";
import { CHAPTER_EXTRACTION_RULES, EXTRACTION_SYSTEM_PROMPT } from "@/lib/extraction-prompt";
import { requestOpenRouterText } from "@/lib/openrouter";
import { isChapterType, type VisualSpec } from "@/lib/visual-types";

const PRIMARY_MODEL = "anthropic/claude-opus-4-6";
const FALLBACK_MODEL = "anthropic/claude-sonnet-4-5";

function cleanJsonResponse(content: string) {
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  try {
    return JSON.parse(trimmed);
  } catch {
    const arrayStart = trimmed.indexOf("[");
    const arrayEnd = trimmed.lastIndexOf("]");
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
      return JSON.parse(trimmed.slice(arrayStart, arrayEnd + 1));
    }
    throw new Error("Invalid JSON");
  }
}

function getVisualsFromPayload(payload: unknown): VisualSpec[] {
  if (Array.isArray(payload)) {
    return payload as VisualSpec[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    "visuals" in payload &&
    Array.isArray((payload as { visuals: unknown }).visuals)
  ) {
    return (payload as { visuals: VisualSpec[] }).visuals;
  }

  throw new Error("Payload did not contain a visual array.");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const chapterType = String(body?.chapterType ?? "");
    const chapterText = typeof body?.chapterText === "string" ? body.chapterText.trim() : "";

    if (!isChapterType(chapterType)) {
      return NextResponse.json({ error: "Invalid chapter type." }, { status: 400 });
    }

    if (!chapterText) {
      return NextResponse.json({ error: "Chapter text is required." }, { status: 400 });
    }

    if (chapterText.length < 200) {
      return NextResponse.json(
        { error: "Chapter text must be at least 200 characters." },
        { status: 400 }
      );
    }

    if (chapterText.length > 80000) {
      return NextResponse.json(
        { error: "Chapter text is too long. Try one chapter at a time." },
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
      systemPrompt: `${EXTRACTION_SYSTEM_PROMPT}\n\n${CHAPTER_EXTRACTION_RULES[chapterType]}`,
      userPrompt: `Chapter type: ${chapterType}\n\nChapter text:\n${chapterText}`,
      maxTokens: 10000,
      primaryModel: PRIMARY_MODEL,
      fallbackModel: FALLBACK_MODEL,
    });

    const parsed = cleanJsonResponse(response.content);
    const visuals = getVisualsFromPayload(parsed);

    if (!visuals.length) {
      return NextResponse.json({ visuals: [], model: response.model });
    }

    return NextResponse.json({ visuals, model: response.model });
  } catch (error) {
    console.error("Extract visuals error:", error);
    return NextResponse.json(
      { error: "Extraction failed, try again." },
      { status: 502 }
    );
  }
}
