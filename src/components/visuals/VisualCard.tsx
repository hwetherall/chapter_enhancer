"use client";

import { useEffect, useState, type RefObject } from "react";
import { PREVIEW_SCALE, VISUAL_CANVAS_WIDTH } from "@/lib/design-system";
import type { RenderedVisual, ScorecardData } from "@/lib/visual-types";
import { AiVisualRenderer } from "@/components/visuals/AiVisualRenderer";
import { ScorecardVisual } from "@/components/visuals/ScorecardVisual";

interface Props {
  item: RenderedVisual;
  captureRef: RefObject<HTMLDivElement | null>;
  copyFeedback?: string;
  onCopyVisual: () => void;
  onCopyHtml: () => void;
  onRegenerate: () => void;
}

function RenderVisualContent({
  item,
  captureRef,
  onReady,
}: {
  item: RenderedVisual;
  captureRef?: RefObject<HTMLDivElement | null>;
  onReady?: () => void;
}) {
  if (item.deterministic) {
    return (
      <ScorecardVisual
        ref={captureRef}
        data={item.spec.data as unknown as ScorecardData}
        title={item.spec.title}
        caption={item.spec.caption}
        insight={item.spec.insight}
      />
    );
  }

  if (!item.html) {
    return null;
  }

  return <AiVisualRenderer ref={captureRef} html={item.html} onReady={onReady} />;
}

export function VisualCard({
  item,
  captureRef,
  copyFeedback,
  onCopyVisual,
  onCopyHtml,
  onRegenerate,
}: Props) {
  const [previewHeight, setPreviewHeight] = useState(240);

  useEffect(() => {
    if (item.status !== "ready") {
      return;
    }

    const node = captureRef.current;
    if (!node) {
      return;
    }

    const updateHeight = () => {
      const measuredHeight = node.scrollHeight || node.getBoundingClientRect().height;
      if (measuredHeight > 0) {
        setPreviewHeight(Math.max(Math.ceil(measuredHeight * PREVIEW_SCALE), 180));
      }
    };

    updateHeight();

    const frame = requestAnimationFrame(updateHeight);
    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [captureRef, item.html, item.spec.id, item.status]);

  const isReady = item.status === "ready";
  const isRendering = item.status === "rendering";

  return (
    <article
      className="overflow-hidden rounded-[12px] border border-[#e2e8f0] bg-white"
      style={{ boxShadow: "0 12px 32px rgba(15, 23, 42, 0.05)" }}
    >
      <div className="flex items-start justify-between gap-4 border-b border-[#e2e8f0] bg-[#f8fafc] px-5 py-4">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#94a3b8]">
            {item.spec.targetSection}
          </div>
          <h3 className="mt-1 text-[15px] font-semibold leading-snug text-[#1A1C22]">
            {item.spec.title}
          </h3>
        </div>
        <div className="rounded-full border border-[#e2e8f0] bg-white px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
          {item.spec.type.replace(/_/g, " ")}
        </div>
      </div>

      <div className="relative bg-white px-4 py-4">
        {isReady ? (
          <>
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: -100000,
                top: 0,
                opacity: 0,
                pointerEvents: "none",
              }}
            >
              <RenderVisualContent item={item} captureRef={captureRef} />
            </div>

            <div style={{ height: previewHeight, overflow: "hidden" }}>
              <div
                style={{
                  width: VISUAL_CANVAS_WIDTH,
                  transform: `scale(${PREVIEW_SCALE})`,
                  transformOrigin: "top left",
                }}
              >
                <RenderVisualContent item={item} />
              </div>
            </div>
          </>
        ) : null}

        {isRendering ? (
          <div className="skeleton-pulse flex min-h-[260px] flex-col justify-between rounded-[10px] border border-dashed border-[#e2e8f0] bg-[#f8fafc] p-5">
            <div className="space-y-3">
              <div className="h-4 w-24 rounded-full bg-white" />
              <div className="h-5 w-2/3 rounded-full bg-white" />
              <div className="mt-8 h-32 rounded-[18px] bg-white" />
            </div>
            <div className="mt-6 text-[12px] text-[#64748b]">Rendering bespoke visual...</div>
          </div>
        ) : null}

        {item.status === "error" ? (
          <div className="flex min-h-[260px] flex-col justify-center rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-5 py-6 text-center">
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#dc2626]">
              Render failed
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-[#7f1d1d]">
              {item.error ?? "The visual HTML was not usable. Click Regenerate to try again."}
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-[#e2e8f0] bg-[#f8fafc] px-5 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCopyVisual}
            disabled={!isReady}
            className="rounded-full bg-[#E8503A] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-[#D4432E] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copyFeedback || "Copy Visual"}
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            className="rounded-full border border-[#e2e8f0] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#6B7280] transition hover:border-[#E8503A]/30 hover:text-[#1A1C22]"
          >
            {isRendering ? "Rendering..." : "Regenerate"}
          </button>
        </div>

        <button
          type="button"
          onClick={onCopyHtml}
          disabled={!isReady}
          className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#6B7280] transition hover:text-[#1A1C22] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Copy HTML
        </button>
      </div>
    </article>
  );
}
