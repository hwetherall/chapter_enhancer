"use client";

import { forwardRef, useEffect } from "react";
import { VISUAL_CANVAS_WIDTH } from "@/lib/design-system";

interface Props {
  html: string;
  onReady?: () => void;
}

export const AiVisualRenderer = forwardRef<HTMLDivElement, Props>(({ html, onReady }, ref) => {
  useEffect(() => {
    if (!onReady) {
      return;
    }

    const frame = requestAnimationFrame(() => onReady());
    return () => cancelAnimationFrame(frame);
  }, [html, onReady]);

  return (
    <div
      ref={ref}
      style={{
        backgroundColor: "#ffffff",
        maxWidth: VISUAL_CANVAS_WIDTH,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

AiVisualRenderer.displayName = "AiVisualRenderer";
