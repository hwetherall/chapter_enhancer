"use client";

import { useState, useRef, useCallback, createRef } from "react";
import { toBlob } from "html-to-image";
import type { VisualSpec } from "@/lib/visual-types";
import { VISUAL_SAMPLE_TEXTS } from "@/lib/visual-samples";
import { VisualRenderer } from "@/components/visuals/VisualRenderer";

const CHAPTER_TYPES = [
  { id: "opportunity-validation", label: "Opportunity Validation" },
  { id: "market-research", label: "Market Research" },
  { id: "competitive-analysis", label: "Competitive Analysis" },
  { id: "executive-summary", label: "Executive Summary" },
] as const;

type ChapterType = (typeof CHAPTER_TYPES)[number]["id"];

export default function VisualsPage() {
  const [selectedChapter, setSelectedChapter] = useState<ChapterType>("opportunity-validation");
  const [inputText, setInputText] = useState("");
  const [visuals, setVisuals] = useState<VisualSpec[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<Record<string, string>>({});
  const visualRefs = useRef<Record<string, React.RefObject<HTMLDivElement | null>>>({});

  const handleGenerate = async () => {
    setError("");
    setVisuals([]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/generate-visuals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterType: selectedChapter,
          chapterText: inputText,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      // Initialize refs for each visual
      const newRefs: Record<string, React.RefObject<HTMLDivElement | null>> = {};
      data.visuals.forEach((v: VisualSpec) => {
        newRefs[v.id] = createRef<HTMLDivElement>();
      });
      visualRefs.current = newRefs;
      setVisuals(data.visuals);
    } catch {
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = () => {
    setInputText(VISUAL_SAMPLE_TEXTS[selectedChapter] || "");
  };

  const handleCopyVisual = useCallback(async (id: string) => {
    const ref = visualRefs.current[id];
    if (!ref?.current) return;
    try {
      setCopyFeedback((prev) => ({ ...prev, [id]: "Rendering..." }));
      const blob = await toBlob(ref.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      if (!blob) throw new Error("Failed to render image");
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopyFeedback((prev) => ({ ...prev, [id]: "Copied as PNG!" }));
      setTimeout(() => setCopyFeedback((prev) => ({ ...prev, [id]: "" })), 2000);
    } catch {
      setCopyFeedback((prev) => ({ ...prev, [id]: "Copy failed" }));
      setTimeout(() => setCopyFeedback((prev) => ({ ...prev, [id]: "" })), 2000);
    }
  }, []);

  const handleRegenerate = async (visualId: string) => {
    // Re-run the full generation (simplified — a targeted per-visual regen would call the API with a narrower prompt)
    // For now, regenerate all
    await handleGenerate();
    void visualId;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-bg-dark border-b border-white/[0.07] px-6 py-3 flex items-center gap-3">
        <a href="/" className="flex items-center gap-3">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" fill="#E8503A" />
            <polygon points="18,8 30,28 6,28" fill="white" />
          </svg>
          <span className="text-text-light text-sm tracking-[0.12em] font-medium" style={{ fontFamily: "var(--font-body)" }}>
            INNOVERA
          </span>
        </a>
        <span className="text-text-muted text-sm ml-2">/ Chapter Visuals</span>
        <div className="flex-1" />
        <a
          href="/"
          className="text-xs text-text-muted hover:text-text-light tracking-[0.04em] transition-colors"
        >
          Chapter Enhancer
        </a>
      </header>

      {/* Input Zone */}
      <div className="bg-bg-light p-8">
        <div className="max-w-4xl mx-auto">
          {/* Section marker */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-primary font-medium text-sm">//</span>
            <span className="text-text-label text-xs tracking-[0.1em] font-medium uppercase">
              CHAPTER TYPE
            </span>
          </div>

          {/* Chapter Type Selector */}
          <div className="flex flex-wrap gap-2 mb-6">
            {CHAPTER_TYPES.map((ct) => (
              <button
                key={ct.id}
                onClick={() => setSelectedChapter(ct.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium tracking-[0.02em] transition-all border ${
                  selectedChapter === ct.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-black/[0.08] bg-white text-text-dark hover:border-primary/30"
                }`}
                style={{ fontFamily: "var(--font-body)" }}
              >
                {ct.label}
              </button>
            ))}
          </div>

          {/* Section marker */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-primary font-medium text-sm">//</span>
            <span className="text-text-label text-xs tracking-[0.1em] font-medium uppercase">
              CHAPTER TEXT
            </span>
          </div>

          {/* Input Area */}
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your completed chapter text here (the output from the Innovera platform, including tables)..."
            className="w-full min-h-[200px] bg-white border border-black/[0.08] rounded-lg p-5 text-text-dark text-sm leading-relaxed resize-y focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-text-muted"
            style={{ fontFamily: "var(--font-body)" }}
          />

          {/* Controls row */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <span className="text-text-label text-xs">
                {inputText.length.toLocaleString()} characters
              </span>
              <button
                onClick={handleLoadSample}
                className="text-xs text-primary hover:text-primary-hover font-medium tracking-[0.02em] transition-colors"
              >
                Load Sample Chapter
              </button>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isLoading || inputText.length < 100}
              className="bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-text-light py-2.5 px-8 rounded-full text-sm font-medium tracking-[0.08em] uppercase transition-all"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {isLoading ? "Generating..." : "Generate Visuals"}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mt-4">
              {error}
            </div>
          )}

          {/* Loading status */}
          {isLoading && (
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-primary text-sm font-medium">
                Analysing chapter and extracting visual data... This usually takes 20-40 seconds.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Visual Gallery */}
      {(visuals.length > 0 || isLoading) && (
        <div className="flex-1 bg-white p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-primary font-medium text-sm">//</span>
              <span className="text-text-label text-xs tracking-[0.1em] font-medium uppercase">
                GENERATED VISUALS ({visuals.length})
              </span>
            </div>

            {isLoading && visuals.length === 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="border border-[#e2e8f0] rounded-xl p-6 skeleton-pulse"
                    style={{ minHeight: 300 }}
                  >
                    <div className="bg-[#f8fafc] rounded h-4 w-24 mb-2" />
                    <div className="bg-[#f8fafc] rounded h-6 w-48 mb-6" />
                    <div className="bg-[#f8fafc] rounded h-40 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {visuals.map((spec) => (
                  <div
                    key={spec.id}
                    className="border border-[#e2e8f0] rounded-xl overflow-hidden"
                    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
                  >
                    {/* Card header */}
                    <div className="px-5 py-3 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between">
                      <div>
                        <div className="text-xs text-text-muted uppercase tracking-[0.05em] font-medium">
                          {spec.targetSection}
                        </div>
                        <div className="text-sm font-semibold text-text-dark mt-0.5">
                          {spec.title}
                        </div>
                      </div>
                      <span className="text-xs bg-white border border-[#e2e8f0] rounded-full px-2 py-0.5 text-text-muted">
                        {spec.type.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Visual content */}
                    <div className="p-2 bg-white">
                      <VisualRenderer
                        spec={spec}
                        ref={visualRefs.current[spec.id]}
                      />
                    </div>

                    {/* Card footer */}
                    <div className="px-5 py-3 border-t border-[#e2e8f0] bg-[#f8fafc] flex items-center gap-3">
                      <button
                        onClick={() => handleCopyVisual(spec.id)}
                        className="px-4 py-1.5 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-medium tracking-[0.04em] transition-colors"
                      >
                        {copyFeedback[spec.id] || "Copy Visual"}
                      </button>
                      <button
                        onClick={() => handleRegenerate(spec.id)}
                        className="px-4 py-1.5 rounded-full border border-[#e2e8f0] text-text-muted text-xs font-medium tracking-[0.04em] hover:border-primary/30 hover:text-text-dark transition-colors"
                      >
                        Regenerate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
