interface OpenRouterRequestOptions {
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  primaryModel: string;
  fallbackModel?: string;
  retryDelayMs?: number;
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractContent(payload: any): string | null {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }

  return null;
}

async function sendChatRequest(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
) {
  return fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
}

export async function requestOpenRouterText({
  apiKey,
  systemPrompt,
  userPrompt,
  maxTokens,
  primaryModel,
  fallbackModel,
  retryDelayMs = 2000,
}: OpenRouterRequestOptions) {
  const models = [primaryModel, fallbackModel].filter(Boolean) as string[];
  const failures: string[] = [];

  for (const model of models) {
    let response = await sendChatRequest(apiKey, model, systemPrompt, userPrompt, maxTokens);

    if (!response.ok && (response.status === 429 || response.status >= 500)) {
      await sleep(retryDelayMs);
      response = await sendChatRequest(apiKey, model, systemPrompt, userPrompt, maxTokens);
    }

    if (!response.ok) {
      failures.push(`${model}: ${response.status} ${await response.text()}`);
      continue;
    }

    const payload = await response.json();
    const content = extractContent(payload);

    if (!content) {
      failures.push(`${model}: empty response`);
      continue;
    }

    return {
      content,
      model,
    };
  }

  throw new Error(failures.join(" | ") || "OpenRouter request failed.");
}
