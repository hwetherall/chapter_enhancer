"use client";

import type { RefObject } from "react";
import type { RenderedVisual } from "@/lib/visual-types";
import { VisualCard } from "@/components/visuals/VisualCard";

interface Props {
  items: RenderedVisual[];
  copyFeedback: Record<string, string>;
  getCaptureRef: (id: string) => RefObject<HTMLDivElement | null>;
  onCopyVisual: (id: string) => void;
  onCopyHtml: (id: string) => void;
  onRegenerate: (id: string) => void;
  onRegenerateAll: () => void;
  onReExtract: () => void;
  isRenderingBatch: boolean;
}

export function VisualGallery({
  items,
  copyFeedback,
  getCaptureRef,
  onCopyVisual,
  onCopyHtml,
  onRegenerate,
  onRegenerateAll,
  onReExtract,
  isRenderingBatch,
}: Props) {
  return (
    <section className="bg-white px-6 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 border-b border-[#e2e8f0] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium text-[#E8503A]">//</span>
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6B7280]">
                Generated Visuals
              </span>
            </div>
            <h2
              className="mt-3 text-[28px] leading-none text-[#1A1C22] sm:text-[34px]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Bespoke visual gallery
            </h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[#6B7280]">
              Each card renders independently, so you can copy finished visuals while the rest are still resolving.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onReExtract}
              className="rounded-full border border-[#e2e8f0] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#6B7280] transition hover:border-[#E8503A]/30 hover:text-[#1A1C22]"
            >
              Re-Extract
            </button>
            <button
              type="button"
              onClick={onRegenerateAll}
              className="rounded-full bg-[#1A1C22] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-[#252830]"
            >
              {isRenderingBatch ? "Rendering..." : "Regenerate All"}
            </button>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between text-[12px] uppercase tracking-[0.14em] text-[#94a3b8]">
          <span>{items.length} visuals</span>
          <span>{isRenderingBatch ? "Pass 2 in progress" : "Ready to copy"}</span>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {items.map((item) => (
            <VisualCard
              key={item.spec.id}
              item={item}
              captureRef={getCaptureRef(item.spec.id)}
              copyFeedback={copyFeedback[item.spec.id]}
              onCopyVisual={() => onCopyVisual(item.spec.id)}
              onCopyHtml={() => onCopyHtml(item.spec.id)}
              onRegenerate={() => onRegenerate(item.spec.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
