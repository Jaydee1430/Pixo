import type { SVGProps } from "react";

export type IconName =
  | "select"
  | "crop"
  | "resize"
  | "bgremove"
  | "bgreplace"
  | "adjust"
  | "object"
  | "enhance"
  | "blurbg"
  | "filters"
  | "export"
  | "undo"
  | "redo"
  | "plus"
  | "minus"
  | "import"
  | "download"
  | "sparkle"
  | "dots"
  | "lock"
  | "upload"
  | "move"
  | "shield"
  | "bolt"
  | "check";

type Props = {
  name: IconName;
  size?: number;
  className?: string;
} & Omit<SVGProps<SVGSVGElement>, "name">;

// viewBox per icon so paths keep their intended proportions
const VIEWBOX: Record<IconName, string> = {
  select: "0 0 18 18",
  crop: "0 0 18 18",
  resize: "0 0 18 18",
  bgremove: "0 0 18 18",
  bgreplace: "0 0 18 18",
  adjust: "0 0 18 18",
  object: "0 0 18 18",
  enhance: "0 0 18 18",
  blurbg: "0 0 18 18",
  filters: "0 0 18 18",
  export: "0 0 18 18",
  undo: "0 0 16 16",
  redo: "0 0 16 16",
  plus: "0 0 16 16",
  minus: "0 0 16 16",
  import: "0 0 16 16",
  download: "0 0 14 14",
  sparkle: "0 0 14 14",
  dots: "0 0 18 18",
  lock: "0 0 12 12",
  upload: "0 0 26 26",
  move: "0 0 14 14",
  shield: "0 0 18 18",
  bolt: "0 0 18 18",
  check: "0 0 14 14",
};

export function Icon({ name, size = 18, className, ...rest }: Props) {
  const stroke = {
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox={VIEWBOX[name]}
      className={className}
      aria-hidden="true"
      style={{ display: "block" }}
      {...rest}
    >
      {name === "select" && (
        <path d="M4 2.5l10 6.2-4.4 1.2-1.7 4.3L4 2.5z" {...stroke} />
      )}
      {name === "move" && (
        <>
          <path d="M7 1v12M1 7h12" {...stroke} strokeWidth={1.2} />
        </>
      )}
      {name === "crop" && <path d="M5 1.5V13h11.5M1.5 5H13v11.5" {...stroke} />}
      {name === "resize" && (
        <>
          <rect x="2.5" y="2.5" width="8" height="8" rx="1" {...stroke} />
          <path
            d="M13 8.5h1.5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V13"
            {...stroke}
          />
        </>
      )}
      {name === "bgremove" && (
        <>
          <circle cx="7" cy="6.5" r="3" {...stroke} />
          <path d="M2.5 15c.8-2.6 2.5-4 4.5-4s3.7 1.4 4.5 4" {...stroke} />
          <path d="M13 3.5l3 3M16 3.5l-3 3" {...stroke} />
        </>
      )}
      {name === "bgreplace" && (
        <>
          <rect x="2" y="2" width="14" height="14" rx="2" {...stroke} />
          <path d="M2 12l4-4 4.5 4.5L13 10l3 3" {...stroke} />
          <circle cx="12" cy="6" r="1.3" fill="currentColor" stroke="none" />
        </>
      )}
      {name === "adjust" && (
        <>
          <path d="M3 5h12M3 9h12M3 13h12" {...stroke} />
          <circle cx="7" cy="5" r="1.8" fill="#15181d" stroke="currentColor" strokeWidth={1.5} />
          <circle cx="12" cy="9" r="1.8" fill="#15181d" stroke="currentColor" strokeWidth={1.5} />
          <circle cx="6" cy="13" r="1.8" fill="#15181d" stroke="currentColor" strokeWidth={1.5} />
        </>
      )}
      {name === "object" && (
        <>
          {/* magic eraser */}
          <path d="M9.5 3.5l5 5-6 6H5l-2.5-2.5 7-8.5z" {...stroke} />
          <path d="M6.5 6.5l5 5" {...stroke} />
          <path d="M13.5 2l.7 1.5L15.7 4l-1.5.7L13.5 6l-.7-1.3L11.3 4l1.5-.5.7-1.5z" {...stroke} strokeWidth={1} />
        </>
      )}
      {name === "enhance" && (
        <>
          {/* wand + sparkles */}
          <path d="M3 15l8-8" {...stroke} />
          <path d="M11 3.5l.9 2 2 .9-2 .9-.9 2-.9-2-2-.9 2-.9.9-2z" {...stroke} />
          <path d="M4 3l.5 1.2L5.7 4.7 4.5 5.2 4 6.4l-.5-1.2L2.3 4.7l1.2-.5L4 3z" {...stroke} strokeWidth={1} />
        </>
      )}
      {name === "blurbg" && (
        <>
          <circle cx="9" cy="9" r="6.5" {...stroke} />
          <path d="M9 2.5a6.5 6.5 0 0 0 0 13z" fill="currentColor" stroke="none" opacity="0.9" />
          <circle cx="9" cy="9" r="3" fill="#15181d" stroke="currentColor" strokeWidth={1.2} />
        </>
      )}
      {name === "filters" && (
        <>
          <circle cx="6.5" cy="7" r="4" {...stroke} />
          <circle cx="11.5" cy="7" r="4" {...stroke} />
          <circle cx="9" cy="11" r="4" {...stroke} />
        </>
      )}
      {name === "export" && (
        <>
          <path d="M9 2v9M9 11L5.5 7.5M9 11l3.5-3.5" {...stroke} />
          <path d="M3 12.5V14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1.5" {...stroke} />
        </>
      )}
      {name === "undo" && (
        <>
          <path d="M6 3L2.5 6.5L6 10" {...stroke} />
          <path d="M2.5 6.5H10a3.5 3.5 0 0 1 0 7H7" {...stroke} />
        </>
      )}
      {name === "redo" && (
        <>
          <path d="M10 3L13.5 6.5L10 10" {...stroke} />
          <path d="M13.5 6.5H6a3.5 3.5 0 0 0 0 7h3" {...stroke} />
        </>
      )}
      {name === "plus" && <path d="M8 3v10M3 8h10" {...stroke} />}
      {name === "minus" && <path d="M3 8h10" {...stroke} />}
      {name === "import" && (
        <>
          <path d="M8 10V2M8 2L5 5M8 2l3 3" {...stroke} />
          <path d="M3 10v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" {...stroke} />
        </>
      )}
      {name === "download" && (
        <>
          <path d="M7 1v8M7 9l-3-3M7 9l3-3" {...stroke} />
          <path d="M2 10v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2" {...stroke} />
        </>
      )}
      {name === "sparkle" && (
        <path d="M7 1l1.5 3.5L12 6 8.5 7.5 7 11 5.5 7.5 2 6l3.5-1.5L7 1z" {...stroke} strokeWidth={1.2} />
      )}
      {name === "dots" && (
        <>
          <circle cx="4" cy="9" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="9" cy="9" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="14" cy="9" r="1.4" fill="currentColor" stroke="none" />
        </>
      )}
      {name === "lock" && (
        <>
          <rect x="2.5" y="5" width="7" height="5.5" rx="1" {...stroke} strokeWidth={1.2} />
          <path d="M4 5V3.5a2 2 0 0 1 4 0V5" {...stroke} strokeWidth={1.2} />
        </>
      )}
      {name === "upload" && (
        <>
          <path d="M13 17V4M13 4l-5 5M13 4l5 5" {...stroke} strokeWidth={1.8} />
          <path d="M4 17v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" {...stroke} strokeWidth={1.8} />
        </>
      )}
      {name === "shield" && (
        <path d="M9 1.5l6 2.2v4.6c0 4-2.7 6.6-6 7.7-3.3-1.1-6-3.7-6-7.7V3.7l6-2.2z" {...stroke} />
      )}
      {name === "bolt" && (
        <path d="M10 1.5L3.5 10.5H8l-1 6 6.5-9H9l1-6z" {...stroke} />
      )}
      {name === "check" && <path d="M2.5 7.5l3 3 6-6.5" {...stroke} />}
    </svg>
  );
}
