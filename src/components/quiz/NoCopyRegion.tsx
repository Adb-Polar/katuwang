"use client";

import type { ClipboardEvent, MouseEvent, DragEvent, ReactNode } from "react";

type BlockableEvent = ClipboardEvent | MouseEvent | DragEvent;
const block = (event: BlockableEvent) => event.preventDefault();

/**
 * Wraps in-progress quiz content so the questions cannot be selected, copied,
 * cut, dragged out, or reached through the context menu. A deterrent against
 * casual copy-paste — not a guarantee (screenshots still work). Pass
 * `enabled={false}` for the graded review, where copying is fine.
 */
export default function NoCopyRegion({ enabled = true, children }: { enabled?: boolean; children: ReactNode }) {
  if (!enabled) return <>{children}</>;
  return (
    <div className="select-none" onCopy={block} onCut={block} onContextMenu={block} onDragStart={block}>
      {children}
    </div>
  );
}
