import { NextRequest, NextResponse } from "next/server";
import { VISUAL_EXTRACTION_PROMPT, CHAPTER_VISUAL_RULES } from "@/lib/visual-prompts";

const VALID_CHAPTER_TYPES = [
  "opportunity-validation",
  "market-research",
  "competitive-analysis",
  "executive-summary",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chapterType, chapterText } = body;

    if (!chapterType || !VALID_CHAPTER_TYPES.includes(chapterType)) {
      return NextResponse.json(
        { error: "Invalid chapter type." },
        { status: 400 }
      );
    }

    if (!chapterText || typeof chapterText !== "string") {
      return NextResponse.json(
        { error: "Chapter text is required." },
        { status: 400 }
      );
    }

    if (chapterText.length < 100) {
      return NextResponse.json(
        { error: "Chapter text must be at least 100 characters." },
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

    const systemPrompt = `${VISUAL_EXTRACTION_PROMPT}\n\n${CHAPTER_VISUAL_RULES[chapterType]}`;

    const makeRequest = async (modelId: string) => {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelId,
          max_tokens: 8000,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Analyse this ${chapterType.replace(/-/g, " ")} chapter and extract visual specifications. Return ONLY a JSON array of VisualSpec objects.\n\n${chapterText}`,
            },
          ],
        }),
      });
      return res;
    };

    let model = "anthropic/claude-opus-4-6";
    let response = await makeRequest(model);

    if (!response.ok) {
      console.warn(`Primary model failed (${response.status}), trying fallback...`);
      model = "anthropic/claude-sonnet-4-5";
      response = await makeRequest(model);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter error:", errorText);
      return NextResponse.json(
        { error: `AI service error (${response.status}). Please try again.` },
        { status: 502 }
      );
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No content returned from AI." },
        { status: 502 }
      );
    }

    // Strip markdown code fences if the model wraps them
    content = content.trim();
    if (content.startsWith("```")) {
      content = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }

    try {
      const visuals = JSON.parse(content);
      if (!Array.isArray(visuals)) {
        throw new Error("Response is not an array");
      }
      return NextResponse.json({ visuals, model });
    } catch {
      console.error("Failed to parse AI response as JSON:", content.slice(0, 500));
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Generate visuals API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
