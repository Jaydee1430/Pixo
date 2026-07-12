"use client";

import { useEditor } from "@/store/editorStore";

/**
 * Run an async/heavy image operation with the status-bar spinner showing.
 * `produce` returns the new committed pixels; the result is pushed to history.
 */
export async function runOp(
  label: string,
  produce: () => ImageData | Promise<ImageData>,
): Promise<void> {
  const s = useEditor.getState();
  if (s.processing) return; // ignore overlapping ops
  s.setProcessing(label);
  // let the spinner paint before we block the main thread
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  await new Promise((r) => setTimeout(r, 0));
  try {
    const result = await produce();
    useEditor.getState().applyOp(result);
  } catch (e) {
    console.error(e);
    window.alert("Sorry — something went wrong running that operation. Please try again.");
  } finally {
    useEditor.getState().setProcessing(null);
  }
}
