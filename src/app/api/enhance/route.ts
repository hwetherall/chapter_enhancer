import { NextRequest, NextResponse } from "next/server";
import { BASE_OUTPUT_RULES, CHAPTER_PROMPTS } from "@/lib/prompts";

const VALID_CHAPTER_TYPES = [
  "opportunity-validation",
  "market-research",
  "competitive-analysis",
  "executive-summary",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chapterType, inputText } = body;

    if (!chapterType || !VALID_CHAPTER_TYPES.includes(chapterType)) {
      return NextResponse.json(
        { error: "Invalid chapter type. Choose from: Opportunity Validation, Market Research, Competitive Analysis, or Executive Summary." },
        { status: 400 }
      );
    }

    if (!inputText || typeof inputText !== "string") {
      return NextResponse.json(
        { error: "Input text is required." },
        { status: 400 }
      );
    }

    if (inputText.length < 100) {
      return NextResponse.json(
        { error: "Input text must be at least 100 characters. Please provide more detail for the AI to work with." },
        { status: 400 }
      );
    }

    if (inputText.length > 50000) {
      return NextResponse.json(
        { error: "Input text exceeds 50,000 characters. Please split your content into smaller sections." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key is not configured. Please set OPENROUTER_API_KEY in your environment variables." },
        { status: 500 }
      );
    }

    const systemPrompt = `${BASE_OUTPUT_RULES}\n\n${CHAPTER_PROMPTS[chapterType]}`;

    let model = "anthropic/claude-opus-4-6";
    let usedFallback = false;

    const makeRequest = async (modelId: string) => {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelId,
          max_tokens: 200000,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Here is the executive summary / chapter draft to enhance. Transform it according to the chapter guidelines, adding all required tables, visuals, and structure. Output ONLY the HTML:\n\n${inputText}`,
            },
          ],
        }),
      });
      return res;
    };

    let response = await makeRequest(model);

    if (!response.ok) {
      console.warn(`Primary model failed (${response.status}), trying fallback...`);
      model = "anthropic/claude-haiku-4-5";
      usedFallback = true;
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

    if (usedFallback) {
      console.warn("Used fallback model: anthropic/claude-haiku-4-5");
    }

    const html = data.choices?.[0]?.message?.content;

    if (!html) {
      return NextResponse.json(
        { error: "No content returned from AI. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ html, model });
  } catch (error) {
    console.error("Enhance API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
