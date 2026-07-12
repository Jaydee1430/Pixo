import type { IconName } from "@/components/ui/Icon";
import type { ToolId } from "@/lib/types";

export interface ToolDef {
  id: ToolId;
  label: string;
  key: string; // keyboard shortcut hint
  icon: IconName;
  version: 1 | 2;
  blurb: string; // short description used on the landing tools grid
}

export const TOOLS: ToolDef[] = [
  { id: "select", label: "Select / Move", key: "V", icon: "select", version: 1, blurb: "Reposition and inspect. Precise X / Y / W / H readouts as you work." },
  { id: "crop", label: "Crop", key: "C", icon: "crop", version: 1, blurb: "Free-form or locked ratios for every platform, with pixel-precise handles." },
  { id: "resize", label: "Resize", key: "R", icon: "resize", version: 1, blurb: "Exact dimensions or one-tap presets. Aspect lock keeps proportions safe." },
  { id: "bgremove", label: "Background Removal", key: "B", icon: "bgremove", version: 1, blurb: "Auto, magic-wand, or brush — cut out the background with a click or by hand." },
  { id: "bgreplace", label: "Background Replace", key: "G", icon: "bgreplace", version: 1, blurb: "Drop the subject onto a solid color or your own image — composited in." },
  { id: "adjust", label: "Adjustments", key: "A", icon: "adjust", version: 1, blurb: "Brightness, contrast, saturation, exposure, and temperature — all live." },
  { id: "object", label: "Object Remover", key: "O", icon: "object", version: 2, blurb: "Brush over a distraction and let inpainting fill it in seamlessly." },
  { id: "enhance", label: "Enhance", key: "H", icon: "enhance", version: 2, blurb: "Auto white-balance, levels, and sharpening to fix flat photos instantly." },
  { id: "filters", label: "Filters", key: "F", icon: "filters", version: 2, blurb: "A curated set of looks — mono, warm, vintage, vivid — with intensity." },
  { id: "export", label: "Export", key: "E", icon: "export", version: 1, blurb: "PNG, JPG, or WebP at any quality. What you see is what you download." },
];

export const TOOL_BY_ID: Record<ToolId, ToolDef> = Object.fromEntries(
  TOOLS.map((t) => [t.id, t]),
) as Record<ToolId, ToolDef>;
