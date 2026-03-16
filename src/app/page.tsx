"use client";

import { useState, useRef, useCallback } from "react";
import { SAMPLE_TEXTS } from "@/lib/samples";

const CHAPTER_TYPES = [
  { id: "opportunity-validation", label: "Opportunity Validation" },
  { id: "market-research", label: "Market Research" },
  { id: "competitive-analysis", label: "Competitive Analysis" },
  { id: "executive-summary", label: "Executive Summary" },
] as const;

type ChapterType = (typeof CHAPTER_TYPES)[number]["id"];

export default function Home() {
  const [selectedChapter, setSelectedChapter] = useState<ChapterType>("opportunity-validation");
  const [inputText, setInputText] = useState("");
  const [outputHtml, setOutputHtml] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"preview" | "source">("preview");
  const [copyFeedback, setCopyFeedback] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  const handleEnhance = async () => {
    setError("");
    setOutputHtml("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterType: selectedChapter,
          inputText,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setOutputHtml(data.html);
      setViewMode("preview");
    } catch {
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = () => {
    setInputText(SAMPLE_TEXTS[selectedChapter] || "");
  };

  const showCopyFeedback = (msg: string) => {
    setCopyFeedback(msg);
    setTimeout(() => setCopyFeedback(""), 2000);
  };

  const handleCopyRichHtml = useCallback(async () => {
    if (!previewRef.current) return;
    try {
      const html = previewRef.current.innerHTML;
      const blob = new Blob([html], { type: "text/html" });
      const textBlob = new Blob([html], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": blob,
          "text/plain": textBlob,
        }),
      ]);
      showCopyFeedback("Rich HTML copied!");
    } catch {
      showCopyFeedback("Copy failed. Try Copy Source instead.");
    }
  }, []);

  const handleCopySource = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(outputHtml);
      showCopyFeedback("Source HTML copied!");
    } catch {
      showCopyFeedback("Copy failed.");
    }
  }, [outputHtml]);

  const hasOutput = outputHtml.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-bg-dark border-b border-white/[0.07] px-6 py-3 flex items-center gap-3">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect width="36" height="36" fill="#E8503A" />
          <polygon points="18,8 30,28 6,28" fill="white" />
        </svg>
        <span
          className="text-text-light font-[var(--font-body)] text-sm tracking-[0.12em] font-medium"
          style={{ fontFamily: "var(--font-body)" }}
        >
          INNOVERA
        </span>
        <span className="text-text-muted text-sm ml-2">/ Chapter Enhancer</span>
        <div className="flex-1" />
        <a
          href="/visuals"
          className="text-xs text-text-muted hover:text-text-light tracking-[0.04em] transition-colors"
        >
          Chapter Visuals
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Left Panel - Input */}
        <div
          className={`${
            hasOutput ? "lg:w-[480px] lg:min-w-[480px]" : "w-full max-w-3xl mx-auto"
          } bg-bg-light p-8 flex flex-col gap-6 transition-all`}
        >
          {/* Section marker */}
          <div className="flex items-center gap-2">
            <span className="text-primary font-medium text-sm" style={{ fontFamily: "var(--font-body)" }}>
              //
            </span>
            <span className="text-text-label text-xs tracking-[0.1em] font-medium uppercase">
              CHAPTER TYPE
            </span>
          </div>

          {/* Chapter Type Selector */}
          <div className="flex flex-wrap gap-2">
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
          <div className="flex items-center gap-2 mt-2">
            <span className="text-primary font-medium text-sm">
              //
            </span>
            <span className="text-text-label text-xs tracking-[0.1em] font-medium uppercase">
              INPUT TEXT
            </span>
          </div>

          {/* Input Area */}
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your executive summary or chapter draft text here..."
            className="w-full flex-1 min-h-[300px] bg-white border border-black/[0.08] rounded-lg p-5 text-text-dark text-sm leading-relaxed resize-none focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-text-muted"
            style={{ fontFamily: "var(--font-body)" }}
          />

          {/* Character count */}
          <div className="flex items-center justify-between">
            <span className="text-text-label text-xs">
              {inputText.length.toLocaleString()} / 50,000 characters
            </span>
            <button
              onClick={handleLoadSample}
              className="text-xs text-primary hover:text-primary-hover font-medium tracking-[0.02em] transition-colors"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Load Sample
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Status: why button is disabled or that we're processing */}
          <div className="min-h-[20px]" aria-live="polite" aria-atomic="true">
            {isLoading && (
              <p className="text-primary text-sm font-medium flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden />
                Sending to AI… This usually takes 30–90 seconds.
              </p>
            )}
            {!isLoading && inputText.length > 0 && inputText.length < 100 && (
              <p className="text-text-label text-sm">
                Add at least {100 - inputText.length} more character{100 - inputText.length !== 1 ? "s" : ""} to enable Enhance.
              </p>
            )}
          </div>

          {/* CTA Button */}
          <button
            onClick={handleEnhance}
            disabled={isLoading || inputText.length < 100}
            className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-text-light py-3 px-6 rounded-full text-sm font-medium tracking-[0.08em] uppercase transition-all"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {isLoading ? "Enhancing…" : "Enhance Chapter"}
          </button>
        </div>

        {/* Right Panel - Output */}
        {(hasOutput || isLoading) && (
          <div className="flex-1 flex flex-col bg-bg-dark border-l border-white/[0.07]">
            {/* Output Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <span className="text-primary font-medium text-sm">//</span>
                <span className="text-text-label text-xs tracking-[0.1em] font-medium uppercase">
                  OUTPUT
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* View Toggle */}
                {hasOutput && (
                  <div className="flex rounded-full border border-white/[0.07] overflow-hidden">
                    <button
                      onClick={() => setViewMode("preview")}
                      className={`px-3 py-1.5 text-xs font-medium tracking-[0.04em] transition-colors ${
                        viewMode === "preview"
                          ? "bg-card-dark text-text-light"
                          : "text-text-muted hover:text-text-light"
                      }`}
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => setViewMode("source")}
                      className={`px-3 py-1.5 text-xs font-medium tracking-[0.04em] transition-colors ${
                        viewMode === "source"
                          ? "bg-card-dark text-text-light"
                          : "text-text-muted hover:text-text-light"
                      }`}
                    >
                      Source
                    </button>
                  </div>
                )}

                {/* Copy Buttons */}
                {hasOutput && (
                  <>
                    <button
                      onClick={handleCopyRichHtml}
                      className="px-3 py-1.5 rounded-full border border-primary/40 text-primary text-xs font-medium tracking-[0.04em] hover:bg-primary/10 transition-colors"
                    >
                      Copy Rich HTML
                    </button>
                    <button
                      onClick={handleCopySource}
                      className="px-3 py-1.5 rounded-full border border-white/[0.12] text-text-muted text-xs font-medium tracking-[0.04em] hover:text-text-light hover:border-white/[0.2] transition-colors"
                    >
                      Copy Source
                    </button>
                  </>
                )}

                {/* Copy Feedback */}
                {copyFeedback && (
                  <span className="text-green-400 text-xs font-medium animate-pulse">
                    {copyFeedback}
                  </span>
                )}
              </div>
            </div>

            {/* Output Content */}
            <div className="flex-1 overflow-auto p-6">
              {isLoading && !hasOutput ? (
                <div className="flex flex-col items-center justify-center min-h-[280px] gap-6">
                  <div className="flex flex-col items-center gap-3">
                    <span
                      className="inline-block w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"
                      aria-hidden
                    />
                    <h3 className="text-text-light font-semibold text-lg" style={{ fontFamily: "var(--font-body)" }}>
                      Enhancing your chapter
                    </h3>
                    <p className="text-text-muted text-sm text-center max-w-sm">
                      The AI is building tables, structure, and visuals. This usually takes 30–90 seconds.
                    </p>
                  </div>
                  <div className="space-y-4 w-full max-w-xl">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="skeleton-pulse">
                        <div
                          className="bg-card-dark rounded-lg"
                          style={{
                            height: i === 0 ? 36 : i % 3 === 0 ? 80 : 18,
                            width: i === 0 ? "50%" : i % 2 === 0 ? "100%" : "88%",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : viewMode === "preview" ? (
                <div
                  ref={previewRef}
                  className="bg-white rounded-lg p-8 shadow-lg"
                  dangerouslySetInnerHTML={{ __html: outputHtml }}
                />
              ) : (
                <pre className="bg-card-dark rounded-lg p-6 text-text-muted text-xs leading-relaxed overflow-auto whitespace-pre-wrap break-all font-mono">
                  {outputHtml}
                </pre>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
