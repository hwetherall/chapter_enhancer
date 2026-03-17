"use client";

import {
  createRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { toBlob } from "html-to-image";
import { VisualGallery } from "@/components/visuals/VisualGallery";
import { VISUAL_CANVAS_WIDTH } from "@/lib/design-system";
import { SAMPLE_TEXTS } from "@/lib/samples";
import {
  CHAPTER_TYPE_OPTIONS,
  type ChapterType,
  type RenderedVisual,
  type VisualSpec,
} from "@/lib/visual-types";

const MAX_CONCURRENT_RENDERS = 4;
const MIN_CHARACTERS = 200;
const MAX_CHARACTERS = 80000;

async function runWithConcurrency<T>(
  values: T[],
  limit: number,
  worker: (value: T) => Promise<void>
) {
  let index = 0;

  const runners = Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (index < values.length) {
      const currentIndex = index;
      index += 1;
      await worker(values[currentIndex]);
    }
  });

  await Promise.all(runners);
}

export default function Home() {
  const [chapterType, setChapterType] = useState<ChapterType>("opportunity-validation");
  const [chapterText, setChapterText] = useState("");
  const [items, setItems] = useState<RenderedVisual[]>([]);
  const [error, setError] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isRenderingBatch, setIsRenderingBatch] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<Record<string, string>>({});

  const activeBatchRef = useRef(0);
  const captureRefs = useRef<Record<string, RefObject<HTMLDivElement | null>>>({});
  const feedbackTimers = useRef<Record<string, number>>({});

  useEffect(() => {
    return () => {
      Object.values(feedbackTimers.current).forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const getCaptureRef = useCallback((id: string) => {
    if (!captureRefs.current[id]) {
      captureRefs.current[id] = createRef<HTMLDivElement>();
    }

    return captureRefs.current[id];
  }, []);

  const setTransientFeedback = useCallback((id: string, message: string) => {
    if (feedbackTimers.current[id]) {
      window.clearTimeout(feedbackTimers.current[id]);
    }

    setCopyFeedback((current) => ({ ...current, [id]: message }));

    feedbackTimers.current[id] = window.setTimeout(() => {
      setCopyFeedback((current) => ({ ...current, [id]: "" }));
    }, 2200);
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<RenderedVisual>) => {
    setItems((current) =>
      current.map((item) =>
        item.spec.id === id
          ? {
              ...item,
              ...patch,
            }
          : item
      )
    );
  }, []);

  const ensureRefsForSpecs = useCallback(
    (specs: VisualSpec[]) => {
      specs.forEach((spec) => {
        getCaptureRef(spec.id);
      });
    },
    [getCaptureRef]
  );

  const createInitialItems = useCallback(
    (specs: VisualSpec[]): RenderedVisual[] => {
      ensureRefsForSpecs(specs);

      return specs.map((spec) => ({
        spec,
        deterministic: spec.type === "scorecard",
        html: null,
        status: spec.type === "scorecard" ? "ready" : "rendering",
        error: null,
      }));
    },
    [ensureRefsForSpecs]
  );

  const renderSpec = useCallback(
    async (spec: VisualSpec, runId: number) => {
      if (spec.type === "scorecard") {
        updateItem(spec.id, {
          status: "ready",
          error: null,
          html: null,
          deterministic: true,
        });
        return;
      }

      updateItem(spec.id, {
        status: "rendering",
        error: null,
        html: null,
        deterministic: false,
      });

      try {
        const response = await fetch("/api/render-visual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ spec }),
        });

        const payload = await response.json();

        if (runId !== activeBatchRef.current) {
          return;
        }

        if (!response.ok || typeof payload.html !== "string") {
          throw new Error(payload.error || "Render failed. Click Regenerate to try again.");
        }

        updateItem(spec.id, {
          html: payload.html,
          status: "ready",
          error: null,
          deterministic: false,
        });
      } catch (renderError) {
        if (runId !== activeBatchRef.current) {
          return;
        }

        updateItem(spec.id, {
          html: null,
          status: "error",
          error:
            renderError instanceof Error
              ? renderError.message
              : "Render failed. Click Regenerate to try again.",
          deterministic: false,
        });
      }
    },
    [updateItem]
  );

  const renderBatch = useCallback(
    async (specs: VisualSpec[], runId: number) => {
      const aiSpecs = specs.filter((spec) => spec.type !== "scorecard");

      setIsRenderingBatch(aiSpecs.length > 0);

      if (!aiSpecs.length) {
        return;
      }

      await runWithConcurrency(aiSpecs, MAX_CONCURRENT_RENDERS, async (spec) => {
        if (runId !== activeBatchRef.current) {
          return;
        }

        await renderSpec(spec, runId);
      });

      if (runId === activeBatchRef.current) {
        setIsRenderingBatch(false);
      }
    },
    [renderSpec]
  );

  const handleGenerate = useCallback(async () => {
    const trimmed = chapterText.trim();

    if (trimmed.length < MIN_CHARACTERS) {
      setError(`Paste at least ${MIN_CHARACTERS} characters before generating visuals.`);
      return;
    }

    if (trimmed.length > MAX_CHARACTERS) {
      setError("Chapter text too long, try pasting one chapter at a time.");
      return;
    }

    const runId = activeBatchRef.current + 1;
    activeBatchRef.current = runId;

    setError("");
    setItems([]);
    setIsExtracting(true);
    setIsRenderingBatch(false);

    try {
      const response = await fetch("/api/extract-visuals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterType,
          chapterText: trimmed,
        }),
      });

      const payload = await response.json();

      if (runId !== activeBatchRef.current) {
        return;
      }

      if (!response.ok) {
        throw new Error(payload.error || "Extraction failed, try again.");
      }

      const visuals = Array.isArray(payload.visuals) ? (payload.visuals as VisualSpec[]) : [];

      if (!visuals.length) {
        setError("No visualisable data found in this chapter.");
        return;
      }

      setItems(createInitialItems(visuals));
      setIsExtracting(false);

      void renderBatch(visuals, runId);
    } catch (extractError) {
      if (runId !== activeBatchRef.current) {
        return;
      }

      setError(
        extractError instanceof Error ? extractError.message : "Extraction failed, try again."
      );
    } finally {
      if (runId === activeBatchRef.current) {
        setIsExtracting(false);
      }
    }
  }, [chapterText, chapterType, createInitialItems, renderBatch]);

  const handleLoadSample = useCallback(() => {
    setChapterText(SAMPLE_TEXTS[chapterType]);
    setError("");
  }, [chapterType]);

  const handleCopyVisual = useCallback(
    async (id: string) => {
      const captureRef = getCaptureRef(id);

      if (!captureRef.current) {
        setTransientFeedback(id, "Render first");
        return;
      }

      try {
        setCopyFeedback((current) => ({ ...current, [id]: "Rendering..." }));

        const blob = await toBlob(captureRef.current, {
          pixelRatio: 2,
          backgroundColor: "#ffffff",
          width: VISUAL_CANVAS_WIDTH,
        });

        if (!blob) {
          throw new Error("Render failed");
        }

        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
          }),
        ]);

        setTransientFeedback(id, "Copied PNG");
      } catch {
        setTransientFeedback(id, "Copy failed");
      }
    },
    [getCaptureRef, setTransientFeedback]
  );

  const handleCopyHtml = useCallback(
    async (id: string) => {
      const item = items.find((candidate) => candidate.spec.id === id);
      if (!item) {
        return;
      }

      const captureRef = getCaptureRef(id);
      const html =
        item.html ??
        (item.deterministic && captureRef.current ? captureRef.current.innerHTML : "");

      if (!html) {
        setTransientFeedback(id, "No HTML yet");
        return;
      }

      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([html], { type: "text/plain" }),
          }),
        ]);

        setTransientFeedback(id, "Copied HTML");
      } catch {
        setTransientFeedback(id, "Copy failed");
      }
    },
    [getCaptureRef, items, setTransientFeedback]
  );

  const handleRegenerate = useCallback(
    async (id: string) => {
      const target = items.find((item) => item.spec.id === id);
      if (!target) {
        return;
      }

      await renderSpec(target.spec, activeBatchRef.current);
    },
    [items, renderSpec]
  );

  const handleRegenerateAll = useCallback(() => {
    if (!items.length) {
      return;
    }

    const runId = activeBatchRef.current + 1;
    activeBatchRef.current = runId;

    const specs = items.map((item) => item.spec);
    setItems(createInitialItems(specs));
    void renderBatch(specs, runId);
  }, [createInitialItems, items, renderBatch]);

  const helperText =
    chapterText.trim().length < MIN_CHARACTERS
      ? `Add ${MIN_CHARACTERS - chapterText.trim().length} more characters to enable generation.`
      : chapterText.trim().length > MAX_CHARACTERS
        ? "This chapter is above the 80,000 character limit."
        : isExtracting
          ? "Analysing chapter and extracting visual data..."
          : isRenderingBatch
            ? "Pass 2 is generating bespoke visuals. Cards will resolve one by one."
            : "Generate visual specs first, then copy the visuals you want as PNGs.";

  return (
    <div className="min-h-screen bg-white text-[#1A1C22]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#1A1C22]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4 sm:px-8">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <rect width="36" height="36" fill="#E8503A" />
            <polygon points="18,8 30,28 6,28" fill="white" />
          </svg>
          <div className="min-w-0">
            <div className="text-[13px] font-medium uppercase tracking-[0.24em] text-white">
              INNOVERA
            </div>
            <div className="text-[12px] text-[#9CA3AF]">Chapter Visuals</div>
          </div>
          <div className="ml-auto text-right text-[11px] uppercase tracking-[0.14em] text-[#9CA3AF]">
            two-pass extraction + rendering
          </div>
        </div>
      </header>

      <main>
        <section
          className="relative overflow-hidden border-b border-[#eadfd9]"
          style={{
            background:
              "radial-gradient(circle at top right, rgba(232,80,58,0.14), transparent 28%), linear-gradient(180deg, #F5F0EC 0%, #f8f3ef 100%)",
          }}
        >
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-10 sm:px-8 lg:grid-cols-[minmax(0,1.2fr)_340px] lg:items-start lg:gap-12 lg:py-14">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium text-[#E8503A]">//</span>
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6B7280]">
                  Internal Tool
                </span>
              </div>

              <h1
                className="mt-5 max-w-4xl text-[40px] leading-[0.96] text-[#1A1C22] sm:text-[52px] lg:text-[62px]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Turn finished memo chapters into a gallery of copy-ready visuals.
              </h1>

              <p className="mt-5 max-w-3xl text-[15px] leading-7 text-[#6B7280] sm:text-[16px]">
                Pass 1 extracts the strongest chart and diagram opportunities from the chapter.
                Pass 2 renders each visual individually so every card gets a bespoke spatial
                treatment instead of a template.
              </p>

              <div className="mt-8 rounded-[18px] border border-[#eadfd9] bg-white/75 p-5 shadow-[0_18px_50px_rgba(26,28,34,0.06)] backdrop-blur">
                <div className="grid gap-6">
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-[14px] font-medium text-[#E8503A]">//</span>
                      <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6B7280]">
                        Chapter Type
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {CHAPTER_TYPE_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setChapterType(option.id)}
                          className={`rounded-full border px-4 py-2 text-[12px] font-medium uppercase tracking-[0.08em] transition ${
                            chapterType === option.id
                              ? "border-[#E8503A] bg-[#E8503A] text-white"
                              : "border-black/10 bg-white text-[#1A1C22] hover:border-[#E8503A]/40"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-[14px] font-medium text-[#E8503A]">//</span>
                      <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6B7280]">
                        Chapter Text
                      </span>
                    </div>

                    <textarea
                      value={chapterText}
                      onChange={(event) => {
                        setChapterText(event.target.value);
                        if (error) {
                          setError("");
                        }
                      }}
                      placeholder="Paste the completed chapter text here. The more concrete numbers and sequences it contains, the stronger the extracted visuals will be."
                      className="min-h-[320px] w-full resize-y rounded-[16px] border border-black/10 bg-white px-5 py-4 text-[15px] leading-7 text-[#1A1C22] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#E8503A]/50 focus:ring-2 focus:ring-[#E8503A]/10"
                    />

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-3 text-[12px] uppercase tracking-[0.12em] text-[#6B7280]">
                        <span>{chapterText.trim().length.toLocaleString()} characters</span>
                        <button
                          type="button"
                          onClick={handleLoadSample}
                          className="font-medium text-[#E8503A] transition hover:text-[#D4432E]"
                        >
                          Load sample
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {items.length > 0 ? (
                          <button
                            type="button"
                            onClick={handleGenerate}
                            className="rounded-full border border-[#e2e8f0] px-5 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-[#6B7280] transition hover:border-[#E8503A]/30 hover:text-[#1A1C22]"
                          >
                            Re-Extract
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={handleGenerate}
                          disabled={isExtracting || chapterText.trim().length < MIN_CHARACTERS}
                          className="rounded-full bg-[#E8503A] px-6 py-3 text-[11px] font-medium uppercase tracking-[0.16em] text-white transition hover:bg-[#D4432E] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isExtracting ? "Extracting..." : "Generate Visuals"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {error ? (
                <div className="mt-5 rounded-[14px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[14px] text-[#991b1b]">
                  {error}
                </div>
              ) : null}
            </div>

            <aside className="rounded-[20px] bg-[#1A1C22] p-6 text-white shadow-[0_25px_60px_rgba(26,28,34,0.18)]">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#9CA3AF]">
                Generation status
              </div>
              <div className="mt-4 text-[28px] leading-none" style={{ fontFamily: "var(--font-heading)" }}>
                {isExtracting ? "Pass 1" : isRenderingBatch ? "Pass 2" : items.length ? "Ready" : "Waiting"}
              </div>
              <p className="mt-4 text-[14px] leading-7 text-[#d1d5db]">{helperText}</p>

              <div className="mt-8 space-y-4 border-t border-white/10 pt-6">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-[#9CA3AF]">Visual rules</div>
                  <div className="mt-2 text-[14px] leading-7 text-white">
                    Scorecards stay deterministic. Everything else is AI-rendered as self-contained
                    HTML and copied as crisp PNGs.
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-[#9CA3AF]">Input limits</div>
                  <div className="mt-2 text-[14px] leading-7 text-white">
                    Minimum {MIN_CHARACTERS} characters. Maximum {MAX_CHARACTERS.toLocaleString()}.
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-[#9CA3AF]">Copy mode</div>
                  <div className="mt-2 text-[14px] leading-7 text-white">
                    PNG is the default path. HTML copy is available when the editor can accept rich
                    markup directly.
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {isExtracting && !items.length ? (
          <section className="bg-white px-6 py-10 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-7xl">
              <div className="mb-8 flex items-center gap-3 text-[14px] text-[#6B7280]">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#E8503A] border-t-transparent" />
                Analysing chapter and extracting visual data...
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="skeleton-pulse rounded-[12px] border border-[#e2e8f0] bg-white p-5"
                    style={{ boxShadow: "0 12px 32px rgba(15, 23, 42, 0.05)" }}
                  >
                    <div className="h-3 w-24 rounded-full bg-[#f1f5f9]" />
                    <div className="mt-3 h-5 w-2/3 rounded-full bg-[#f1f5f9]" />
                    <div className="mt-6 h-[260px] rounded-[14px] bg-[#f8fafc]" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {items.length ? (
          <VisualGallery
            items={items}
            copyFeedback={copyFeedback}
            getCaptureRef={getCaptureRef}
            onCopyVisual={handleCopyVisual}
            onCopyHtml={handleCopyHtml}
            onRegenerate={handleRegenerate}
            onRegenerateAll={handleRegenerateAll}
            onReExtract={handleGenerate}
            isRenderingBatch={isRenderingBatch}
          />
        ) : null}
      </main>
    </div>
  );
}
