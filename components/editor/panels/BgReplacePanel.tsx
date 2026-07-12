"use client";

import { useRef, useState } from "react";
import { useEditor } from "@/store/editorStore";
import { compositeOverColor, compositeOverImage } from "@/lib/image/ops";
import { hasTransparency, removeByBorders } from "@/lib/image/bgremove";
import { loadImageFile } from "@/lib/image/canvas";
import { cn } from "@/lib/cn";

type Bg =
  | { kind: "color"; color: string }
  | { kind: "transparent" }
  | { kind: "image"; data: ImageData; name: string };

const SWATCHES: { title: string; color: string; style: string }[] = [
  { title: "White", color: "#ffffff", style: "bg-white" },
  { title: "Black", color: "#0b0d10", style: "bg-canvas" },
  { title: "Gray", color: "#8b93a1", style: "bg-text2" },
];

export function BgReplacePanel() {
  const [bg, setBg] = useState<Bg>({ kind: "color", color: "#ffffff" });
  const fileRef = useRef<HTMLInputElement>(null);

  const isColor = (c: string) => bg.kind === "color" && bg.color.toLowerCase() === c.toLowerCase();

  const pickImage = async (file: File) => {
    try {
      const { imageData } = await loadImageFile(file, file.name);
      setBg({ kind: "image", data: imageData, name: file.name });
    } catch {
      window.alert("Couldn't open that background image.");
    }
  };

  const generate = () => {
    const st = useEditor.getState();
    const baked = st.bakedImageData();
    if (!baked) return;
    // Use the existing cut-out if the background is already removed; otherwise
    // auto-detect the background by color first.
    const subject = hasTransparency(baked) ? baked : removeByBorders(baked, 36, 1);
    let result: ImageData;
    if (bg.kind === "transparent") result = subject;
    else if (bg.kind === "image") result = compositeOverImage(subject, bg.data);
    else result = compositeOverColor(subject, bg.color);
    st.applyOp(result);
  };

  return (
    <div className="flex flex-col gap-3.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-text2">Solid color</span>
      <div className="flex items-center gap-2">
        {SWATCHES.map((s) => (
          <button
            key={s.color}
            title={s.title}
            onClick={() => setBg({ kind: "color", color: s.color })}
            className={cn(
              "h-7 w-7 rounded-md border transition",
              s.style,
              isColor(s.color) ? "border-accent ring-2 ring-accent/40" : "border-border",
            )}
          />
        ))}
        <button
          title="Transparent"
          onClick={() => setBg({ kind: "transparent" })}
          className={cn(
            "checkerboard h-7 w-7 rounded-md border transition",
            bg.kind === "transparent" ? "border-accent ring-2 ring-accent/40" : "border-border",
          )}
          style={{ backgroundSize: "10px 10px" }}
        />
        <label
          title="Custom color"
          className={cn(
            "relative h-7 w-7 cursor-pointer overflow-hidden rounded-md border transition",
            bg.kind === "color" && !SWATCHES.some((s) => isColor(s.color))
              ? "border-accent ring-2 ring-accent/40"
              : "border-border",
          )}
          style={{
            background:
              "conic-gradient(from 90deg, #ff5f6d, #ffc371, #47e5bc, #4c8dff, #b06ab3, #ff5f6d)",
          }}
        >
          <input
            type="color"
            className="absolute inset-0 cursor-pointer opacity-0"
            value={bg.kind === "color" ? bg.color : "#4c8dff"}
            onChange={(e) => setBg({ kind: "color", color: e.target.value })}
          />
        </label>
      </div>

      <span className="text-[11px] font-medium uppercase tracking-wider text-text2">Or an image</span>
      <button
        onClick={() => fileRef.current?.click()}
        className={cn(
          "flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-surface2 px-3 text-xs font-medium transition hover:border-border2 hover:text-textbright",
          bg.kind === "image" ? "text-accent" : "text-textlabel",
        )}
      >
        {bg.kind === "image" ? `✓ ${bg.name}` : "Upload background image"}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) pickImage(e.target.files[0]);
          e.target.value = "";
        }}
      />

      <button
        onClick={generate}
        className="mt-1 h-[38px] rounded-md bg-accent text-[13px] font-semibold text-canvas transition hover:brightness-110"
      >
        Replace background
      </button>
      <p className="text-xs text-textmuted">
        Tip: for tricky photos, cut out the background in the Background Removal tool first, then
        pick a backdrop here.
      </p>
    </div>
  );
}
