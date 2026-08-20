"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Slider } from "@/components/ui/Slider";
import BorderGlow from "@/components/ui/BorderGlow";
import type { ToolDef } from "@/lib/tools";
import { magicWandRemove, removeByBorders } from "@/lib/image/bgremove";
import { enhance } from "@/lib/image/enhance";
import { inpaint } from "@/lib/image/inpaint";

interface ToolModalProps {
  tool: ToolDef | null;
  onClose: () => void;
}

type WatermarkPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center" | "tile";
type CollageLayout = "2x2" | "3x3" | "side" | "split" | "featured";
type ImageFormat = "png" | "jpeg" | "webp";
type DocumentConverterId =
  | "pdf-to-word"
  | "word-to-pdf"
  | "txt-to-pdf"
  | "txt-to-word"
  | "markdown-to-html"
  | "html-to-pdf"
  | "json-to-csv"
  | "csv-to-json";

interface CropBox {
  x: number; // 0..100 percentage
  y: number; // 0..100 percentage
  w: number; // 0..100 percentage
  h: number; // 0..100 percentage
}

const CROP_HANDLES = [
  { id: "nw", x: 0, y: 0, cursor: "nwse-resize" },
  { id: "n", x: 0.5, y: 0, cursor: "ns-resize" },
  { id: "ne", x: 1, y: 0, cursor: "nesw-resize" },
  { id: "w", x: 0, y: 0.5, cursor: "ew-resize" },
  { id: "e", x: 1, y: 0.5, cursor: "ew-resize" },
  { id: "sw", x: 0, y: 1, cursor: "nesw-resize" },
  { id: "s", x: 0.5, y: 1, cursor: "ns-resize" },
  { id: "se", x: 1, y: 1, cursor: "nwse-resize" },
];

const PHOTO_FILTERS = [
  { id: "none", label: "Original", filter: "none" },
  { id: "vivid", label: "Vivid Color", filter: "saturate(160%) contrast(115%) brightness(105%)" },
  { id: "mono", label: "Monochrome", filter: "grayscale(100%) contrast(120%)" },
  { id: "warm", label: "Golden Hour", filter: "sepia(35%) saturate(135%) brightness(105%)" },
  { id: "cool", label: "Cool Cyber", filter: "hue-rotate(180deg) saturate(110%) brightness(105%)" },
  { id: "vintage", label: "Retro Faded", filter: "sepia(45%) contrast(85%) brightness(105%) saturate(85%)" },
  { id: "dramatic", label: "Dramatic Film", filter: "contrast(150%) saturate(120%) brightness(95%)" },
  { id: "noir", label: "Dark Noir", filter: "grayscale(100%) contrast(170%) brightness(85%)" },
  { id: "invert", label: "Negative", filter: "invert(100%)" },
  { id: "haze", label: "Dreamy Haze", filter: "brightness(115%) contrast(90%) saturate(130%)" },
  { id: "cyber", label: "Neon Cyber", filter: "hue-rotate(290deg) saturate(180%) contrast(120%)" },
  { id: "emerald", label: "Emerald Glow", filter: "hue-rotate(80deg) saturate(140%) contrast(110%)" },
];

const COLLAGE_LAYOUTS: { id: CollageLayout; label: string }[] = [
  { id: "2x2", label: "2x2 Grid" },
  { id: "3x3", label: "3x3 Grid" },
  { id: "side", label: "Side-by-Side" },
  { id: "split", label: "Split Top/Btm" },
  { id: "featured", label: "1 + 2 Split" },
];

const FIXED_CONVERTER_FORMAT: Partial<Record<ToolDef["id"], ImageFormat>> = {
  "jpg-to-png": "png",
  "png-to-jpg": "jpeg",
  "webp-to-png": "png",
  "png-to-webp": "webp",
  "svg-to-png": "png",
  "svg-to-jpg": "jpeg",
};

function getDefaultFormat(toolId?: ToolDef["id"]): ImageFormat {
  if (!toolId) return "png";
  return FIXED_CONVERTER_FORMAT[toolId] ?? (toolId === "compress" ? "jpeg" : "png");
}

function isFixedConverter(toolId?: ToolDef["id"]) {
  return !!toolId && toolId in FIXED_CONVERTER_FORMAT;
}

function formatLabel(format: ImageFormat) {
  return format === "jpeg" ? "JPG" : format.toUpperCase();
}

function isDocumentConverter(toolId?: ToolDef["id"]): toolId is DocumentConverterId {
  return (
    toolId === "pdf-to-word" ||
    toolId === "word-to-pdf" ||
    toolId === "txt-to-pdf" ||
    toolId === "txt-to-word" ||
    toolId === "markdown-to-html" ||
    toolId === "html-to-pdf" ||
    toolId === "json-to-csv" ||
    toolId === "csv-to-json"
  );
}

function documentAccept(toolId?: ToolDef["id"]) {
  if (toolId === "pdf-to-word") return "application/pdf,.pdf";
  if (toolId === "word-to-pdf") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx";
  }
  if (toolId === "txt-to-pdf" || toolId === "txt-to-word") return "text/plain,.txt";
  if (toolId === "markdown-to-html") return "text/markdown,text/plain,.md,.markdown";
  if (toolId === "html-to-pdf") return "text/html,.html,.htm";
  if (toolId === "json-to-csv") return "application/json,text/json,.json";
  if (toolId === "csv-to-json") return "text/csv,.csv";
  return "image/*";
}

const DOCUMENT_CONVERTER_COPY: Record<
  DocumentConverterId,
  {
    uploadTitle: string;
    description: string;
    outputTitle: string;
    note: string;
    downloadLabel: string;
    error: string;
  }
> = {
  "pdf-to-word": {
    uploadTitle: "Drop a PDF here or browse",
    description: "Creates a Word-compatible DOCX from extractable PDF text.",
    outputTitle: "DOCX Output",
    note: "Text-based conversion runs locally. Complex formatting, scanned pages, and embedded objects may not be preserved.",
    downloadLabel: "Word File",
    error: "Could not convert this PDF. Scanned PDFs may not contain extractable text.",
  },
  "word-to-pdf": {
    uploadTitle: "Drop a DOCX file here or browse",
    description: "Creates a clean PDF from DOCX text content.",
    outputTitle: "PDF Output",
    note: "Text-based conversion runs locally. Complex formatting, scanned pages, and embedded objects may not be preserved.",
    downloadLabel: "PDF File",
    error: "Could not convert this Word file. Please use a DOCX document.",
  },
  "txt-to-pdf": {
    uploadTitle: "Drop a TXT file here or browse",
    description: "Creates a clean PDF from plain text content.",
    outputTitle: "PDF Output",
    note: "Plain text is wrapped into pages locally in your browser.",
    downloadLabel: "PDF File",
    error: "Could not convert this TXT file. Please use a readable plain text file.",
  },
  "txt-to-word": {
    uploadTitle: "Drop a TXT file here or browse",
    description: "Creates an editable DOCX document from plain text.",
    outputTitle: "DOCX Output",
    note: "Plain text paragraphs become editable Word document paragraphs.",
    downloadLabel: "Word File",
    error: "Could not convert this TXT file. Please use a readable plain text file.",
  },
  "markdown-to-html": {
    uploadTitle: "Drop a Markdown file here or browse",
    description: "Creates a standalone HTML file from Markdown content.",
    outputTitle: "HTML Output",
    note: "Common headings, lists, paragraphs, code blocks, links, bold, and italic text are converted locally.",
    downloadLabel: "HTML File",
    error: "Could not convert this Markdown file. Please use a readable .md file.",
  },
  "html-to-pdf": {
    uploadTitle: "Drop an HTML file here or browse",
    description: "Extracts readable HTML text into a simple PDF.",
    outputTitle: "PDF Output",
    note: "HTML tags are parsed locally and readable page text is placed into a clean PDF.",
    downloadLabel: "PDF File",
    error: "Could not convert this HTML file. Please use a readable .html file.",
  },
  "json-to-csv": {
    uploadTitle: "Drop a JSON file here or browse",
    description: "Creates a CSV table from JSON arrays or objects.",
    outputTitle: "CSV Output",
    note: "Arrays of objects become rows. Single objects become key-value rows.",
    downloadLabel: "CSV File",
    error: "Could not convert this JSON file. Please check that it contains valid JSON.",
  },
  "csv-to-json": {
    uploadTitle: "Drop a CSV file here or browse",
    description: "Creates formatted JSON from CSV rows.",
    outputTitle: "JSON Output",
    note: "The first CSV row is used as the field header for the JSON array.",
    downloadLabel: "JSON File",
    error: "Could not convert this CSV file. Please check that it contains a header row.",
  },
};

function outputName(file: File, suffix: string, ext: string) {
  const base = file.name.replace(/\.[^/.]+$/, "") || "pixo-document";
  return `${base}-${suffix}.${ext}`;
}

export function ToolModal({ tool, onClose }: ToolModalProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [outputSrc, setOutputSrc] = useState<string | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentOutputUrl, setDocumentOutputUrl] = useState<string | null>(null);
  const [documentOutputName, setDocumentOutputName] = useState<string>("");
  const [documentPreview, setDocumentPreview] = useState<string>("");
  const [documentStatus, setDocumentStatus] = useState<string>("");
  const [documentError, setDocumentError] = useState<string>("");

  // Background Removal sub-modes & state
  const [bgSubMode, setBgSubMode] = useState<"auto" | "wand" | "brush">("auto");
  const [bgTolerance, setBgTolerance] = useState<number>(32);
  const [bgFeather, setBgFeather] = useState<number>(1);
  const [bgWhole, setBgWhole] = useState<boolean>(false);
  const [bgBrushMode, setBgBrushMode] = useState<"erase" | "restore">("erase");
  const [brushSize, setBrushSize] = useState<number>(40);

  // AI Enhancer state
  const [enhanceStrength, setEnhanceStrength] = useState<number>(100);

  // Object Remover state
  const [objectBrushSize, setObjectBrushSize] = useState<number>(35);
  const [isBrushingObject, setIsBrushingObject] = useState<boolean>(false);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Crop & Rotate Sub-mode State
  const [cropSubMode, setCropSubMode] = useState<"crop" | "rotate">("crop");
  const [cropBox, setCropBox] = useState<CropBox>({ x: 10, y: 10, w: 80, h: 80 });
  const [cropAspect, setCropAspect] = useState<string>("free");
  const dragInfo = useRef<{ handle: string; startX: number; startY: number; box: CropBox } | null>(null);

  // Resize state
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(600);
  const [keepAspect, setKeepAspect] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<number>(1);

  // Compress state
  const [quality, setQuality] = useState<number>(80);

  // Rotate state
  const [rotation, setRotation] = useState<number>(0);

  // Watermark tool state
  const [wmMode, setWmMode] = useState<"text" | "logo">("text");
  const [wmText, setWmText] = useState<string>("Pixo Local");
  const [wmColor, setWmColor] = useState<string>("#ffffff");
  const [wmPosition, setWmPosition] = useState<WatermarkPosition>("bottom-right");
  const [wmOpacity, setWmOpacity] = useState<number>(50);
  const [wmScale, setWmScale] = useState<number>(20);
  const [wmRotation, setWmRotation] = useState<number>(0);
  const [wmLogoSrc, setWmLogoSrc] = useState<string | null>(null);
  const wmLogoInputRef = useRef<HTMLInputElement>(null);

  // Filter state
  const [filterPreset, setFilterPreset] = useState<string>("vivid");

  // Adjustments state
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [saturation, setSaturation] = useState<number>(0);
  const [exposure, setExposure] = useState<number>(0);
  const [hueRotate, setHueRotate] = useState<number>(0);
  const [sepia, setSepia] = useState<number>(0);
  const [grayscale, setGrayscale] = useState<number>(0);
  const [invert, setInvert] = useState<number>(0);
  const [blur, setBlur] = useState<number>(0);

  const resetAdjustments = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setExposure(0);
    setHueRotate(0);
    setSepia(0);
    setGrayscale(0);
    setInvert(0);
    setBlur(0);
  };

  // Convert state
  const [format, setFormat] = useState<ImageFormat>(getDefaultFormat(tool?.id));

  // Collage Maker state
  const [collageImages, setCollageImages] = useState<string[]>([]);
  const [collageLayout, setCollageLayout] = useState<CollageLayout>("2x2");
  const [collageSpacing, setCollageSpacing] = useState<number>(12);
  const [collageRadius, setCollageRadius] = useState<number>(12);
  const [collageBgColor, setCollageBgColor] = useState<string>("#171717");
  const [collageAspect, setCollageAspect] = useState<string>("1:1");
  const collageAddInputRef = useRef<HTMLInputElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const imgContainerRef = useRef<HTMLDivElement>(null);

  function formatBytes(bytes: number): string {
    if (bytes <= 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  const extractPdfText = async (file: File) => {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.mjs",
      import.meta.url,
    ).toString();
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjs.getDocument({ data }).promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const lines = textContent.items
        .map((item) => ("str" in item ? String(item.str) : ""))
        .filter(Boolean);
      pages.push(lines.join(" "));
    }

    return pages.join("\n\n").trim();
  };

  const buildDocxFromText = async (text: string, sourceName: string) => {
    const { Document, Packer, Paragraph, TextRun } = await import("docx");
    const paragraphs = (text || "No extractable text was found in this PDF.")
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .filter(Boolean);

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun({ text: sourceName.replace(/\.[^/.]+$/, ""), bold: true })],
            }),
            ...paragraphs.map(
              (paragraph) =>
                new Paragraph({
                  children: [new TextRun(paragraph)],
                  spacing: { after: 180 },
                }),
            ),
          ],
        },
      ],
    });

    return Packer.toBlob(doc);
  };

  const extractDocxText = async (file: File) => {
    const mammoth = await import("mammoth/mammoth.browser");
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value.trim();
  };

  const buildPdfFromText = async (text: string, sourceName: string) => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    const lineHeight = 16;
    let y = margin;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(sourceName.replace(/\.[^/.]+$/, ""), margin, y);
    y += lineHeight * 2;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    const lines = pdf.splitTextToSize(text || "No text content was found in this DOCX file.", contentWidth) as string[];
    for (const line of lines) {
      if (y > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += lineHeight;
    }

    return pdf.output("blob");
  };

  const escapeHtml = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const markdownInlineToHtml = (value: string) =>
    escapeHtml(value)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');

  const markdownToHtmlDocument = (markdown: string, sourceName: string) => {
    const lines = markdown.replace(/\r\n/g, "\n").split("\n");
    const parts: string[] = [];
    let inList = false;
    let inCode = false;
    let codeLines: string[] = [];

    const closeList = () => {
      if (inList) {
        parts.push("</ul>");
        inList = false;
      }
    };

    for (const line of lines) {
      if (line.trim().startsWith("```")) {
        if (inCode) {
          parts.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
          codeLines = [];
          inCode = false;
        } else {
          closeList();
          inCode = true;
        }
        continue;
      }

      if (inCode) {
        codeLines.push(line);
        continue;
      }

      const trimmed = line.trim();
      if (!trimmed) {
        closeList();
        continue;
      }

      const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        closeList();
        const level = heading[1].length;
        parts.push(`<h${level}>${markdownInlineToHtml(heading[2])}</h${level}>`);
        continue;
      }

      const bullet = trimmed.match(/^[-*]\s+(.+)$/);
      if (bullet) {
        if (!inList) {
          parts.push("<ul>");
          inList = true;
        }
        parts.push(`<li>${markdownInlineToHtml(bullet[1])}</li>`);
        continue;
      }

      closeList();
      parts.push(`<p>${markdownInlineToHtml(trimmed)}</p>`);
    }

    closeList();
    if (inCode) parts.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(sourceName.replace(/\.[^/.]+$/, ""))}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 860px; margin: 48px auto; padding: 0 24px; color: #171717; background: #ffffff; }
    h1, h2, h3, h4, h5, h6 { line-height: 1.2; }
    code, pre { background: #f5f5f5; border: 1px solid #d4d4d4; border-radius: 6px; }
    code { padding: 2px 4px; }
    pre { padding: 14px; overflow-x: auto; }
    a { color: #171717; font-weight: 700; }
  </style>
</head>
<body>
${parts.join("\n")}
</body>
</html>`;
  };

  const textFromHtml = (html: string) => {
    const parsed = new DOMParser().parseFromString(html, "text/html");
    parsed.querySelectorAll("script, style, noscript").forEach((node) => node.remove());
    return (parsed.body.textContent || parsed.documentElement.textContent || "").replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  };

  const csvEscape = (value: unknown) => {
    const text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const jsonToCsv = (raw: string) => {
    const parsed = JSON.parse(raw) as unknown;
    const rows = Array.isArray(parsed) ? parsed : Object.entries(parsed as Record<string, unknown>).map(([key, value]) => ({ key, value }));

    if (!rows.length) return "";
    if (rows.every((row) => row && typeof row === "object" && !Array.isArray(row))) {
      const keys = Array.from(
        new Set(rows.flatMap((row) => Object.keys(row as Record<string, unknown>))),
      );
      return [
        keys.map(csvEscape).join(","),
        ...rows.map((row) => keys.map((key) => csvEscape((row as Record<string, unknown>)[key])).join(",")),
      ].join("\n");
    }

    return ["value", ...rows.map(csvEscape)].join("\n");
  };

  const parseCsv = (csv: string) => {
    const rows: string[][] = [];
    let row: string[] = [];
    let value = "";
    let inQuotes = false;

    for (let i = 0; i < csv.length; i++) {
      const char = csv[i];
      const next = csv[i + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          value += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(value);
        value = "";
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && next === "\n") i++;
        row.push(value);
        if (row.some((cell) => cell.trim() !== "")) rows.push(row);
        row = [];
        value = "";
      } else {
        value += char;
      }
    }

    row.push(value);
    if (row.some((cell) => cell.trim() !== "")) rows.push(row);
    return rows;
  };

  const csvToJson = (csv: string) => {
    const rows = parseCsv(csv);
    if (rows.length < 2) throw new Error("CSV needs a header row and at least one data row.");
    const headers = rows[0].map((header, index) => header.trim() || `field_${index + 1}`);
    return JSON.stringify(
      rows.slice(1).map((cells) =>
        Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])),
      ),
      null,
      2,
    );
  };

  const handleDocumentFile = async (file: File) => {
    if (!tool || !isDocumentConverter(tool.id)) return;
    setDocumentFile(file);
    setDocumentError("");
    setDocumentPreview("");
    setDocumentStatus("Reading document...");
    setProcessing(true);

    try {
      if (documentOutputUrl) URL.revokeObjectURL(documentOutputUrl);

      let blob: Blob;
      let name: string;
      let text: string;

      switch (tool.id) {
        case "pdf-to-word":
          text = await extractPdfText(file);
          setDocumentStatus("Building Word document...");
          blob = await buildDocxFromText(text, file.name);
          name = outputName(file, "converted", "docx");
          break;
        case "word-to-pdf":
          text = await extractDocxText(file);
          setDocumentStatus("Building PDF document...");
          blob = await buildPdfFromText(text, file.name);
          name = outputName(file, "converted", "pdf");
          break;
        case "txt-to-pdf":
          text = await file.text();
          setDocumentStatus("Building PDF document...");
          blob = await buildPdfFromText(text, file.name);
          name = outputName(file, "converted", "pdf");
          break;
        case "txt-to-word":
          text = await file.text();
          setDocumentStatus("Building Word document...");
          blob = await buildDocxFromText(text, file.name);
          name = outputName(file, "converted", "docx");
          break;
        case "markdown-to-html":
          text = await file.text();
          setDocumentStatus("Building HTML document...");
          text = markdownToHtmlDocument(text, file.name);
          blob = new Blob([text], { type: "text/html;charset=utf-8" });
          name = outputName(file, "converted", "html");
          break;
        case "html-to-pdf":
          text = textFromHtml(await file.text());
          setDocumentStatus("Building PDF document...");
          blob = await buildPdfFromText(text, file.name);
          name = outputName(file, "converted", "pdf");
          break;
        case "json-to-csv":
          text = jsonToCsv(await file.text());
          setDocumentStatus("Building CSV file...");
          blob = new Blob([text], { type: "text/csv;charset=utf-8" });
          name = outputName(file, "converted", "csv");
          break;
        case "csv-to-json":
          text = csvToJson(await file.text());
          setDocumentStatus("Building JSON file...");
          blob = new Blob([text], { type: "application/json;charset=utf-8" });
          name = outputName(file, "converted", "json");
          break;
      }

      const url = URL.createObjectURL(blob);
      setDocumentOutputUrl(url);
      setDocumentOutputName(name);
      setDocumentPreview(text.slice(0, 1200) || "No text preview available.");
      setDocumentStatus("Conversion ready");
    } catch (error) {
      console.error(error);
      setDocumentError(DOCUMENT_CONVERTER_COPY[tool.id].error);
      setDocumentStatus("");
    } finally {
      setProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (isDocumentConverter(tool?.id)) {
        handleDocumentFile(files[0]);
      } else if (tool?.id === "collage") {
        loadCollageFiles(files);
      } else {
        loadFile(files[0]);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (isDocumentConverter(tool?.id)) {
        handleDocumentFile(files[0]);
      } else if (tool?.id === "collage") {
        loadCollageFiles(files);
      } else {
        loadFile(files[0]);
      }
    }
  };

  const loadCollageFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const urls: string[] = [];
    let count = 0;
    fileArray.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        urls[index] = evt.target?.result as string;
        count++;
        if (count === fileArray.length) {
          const validUrls = urls.filter(Boolean);
          setCollageImages((prev) => [...prev, ...validUrls]);
          if (validUrls.length > 0) {
            setImageSrc(validUrls[0]);
            setOutputSrc(validUrls[0]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const loadFile = (file: File) => {
    const nextFormat = getDefaultFormat(tool?.id);
    setFormat(nextFormat);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      setImageSrc(result);
      setOutputSrc(result);

      const img = new Image();
      img.onload = () => {
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
        setAspectRatio(img.naturalWidth / img.naturalHeight);
        setCropBox({ x: 10, y: 10, w: 80, h: 80 });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleWmLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setWmLogoSrc(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (keepAspect && aspectRatio) {
      setHeight(Math.round(val / aspectRatio));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (keepAspect && aspectRatio) {
      setWidth(Math.round(val * aspectRatio));
    }
  };

  // Crop Handle Drag Handlers
  const handleCropPointerDown = (e: React.PointerEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragInfo.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      box: { ...cropBox },
    };
  };

  const handleCropPointerMove = (e: React.PointerEvent) => {
    if (!dragInfo.current || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const { handle, startX, startY, box } = dragInfo.current;

    const deltaX = ((e.clientX - startX) / rect.width) * 100;
    const deltaY = ((e.clientY - startY) / rect.height) * 100;

    let nx = box.x;
    let ny = box.y;
    let nw = box.w;
    let nh = box.h;

    const minSize = 10;

    if (handle === "move") {
      nx = Math.max(0, Math.min(100 - nw, box.x + deltaX));
      ny = Math.max(0, Math.min(100 - nh, box.y + deltaY));
    } else {
      if (handle.includes("w")) {
        const potentialX = Math.max(0, Math.min(box.x + box.w - minSize, box.x + deltaX));
        nw = box.w + (box.x - potentialX);
        nx = potentialX;
      }
      if (handle.includes("e")) {
        nw = Math.max(minSize, Math.min(100 - box.x, box.w + deltaX));
      }
      if (handle.includes("n")) {
        const potentialY = Math.max(0, Math.min(box.y + box.h - minSize, box.y + deltaY));
        nh = box.h + (box.y - potentialY);
        ny = potentialY;
      }
      if (handle.includes("s")) {
        nh = Math.max(minSize, Math.min(100 - box.y, box.h + deltaY));
      }

      if (cropAspect !== "free") {
        const [aspectW, aspectH] = cropAspect.split(":").map(Number);
        const targetRatio = aspectW / aspectH;
        const imgAspect = aspectRatio || 1;
        const boxRatio = targetRatio / imgAspect;

        nh = nw / boxRatio;
        if (ny + nh > 100) {
          nh = 100 - ny;
          nw = nh * boxRatio;
        }
      }
    }

    setCropBox({ x: nx, y: ny, w: nw, h: nh });
  };

  const handleCropPointerUp = () => {
    dragInfo.current = null;
  };

  // Apply Interactive Crop
  const executeCrop = async () => {
    if (!outputSrc && !imageSrc) return;
    setProcessing(true);
    try {
      const srcToUse = outputSrc || imageSrc;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = srcToUse!;
      await new Promise((res) => (img.onload = res));

      const cropPxX = (cropBox.x / 100) * img.naturalWidth;
      const cropPxY = (cropBox.y / 100) * img.naturalHeight;
      const cropPxW = (cropBox.w / 100) * img.naturalWidth;
      const cropPxH = (cropBox.h / 100) * img.naturalHeight;

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(cropPxW));
      canvas.height = Math.max(1, Math.round(cropPxH));
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(
          img,
          cropPxX,
          cropPxY,
          cropPxW,
          cropPxH,
          0,
          0,
          canvas.width,
          canvas.height
        );
        setOutputSrc(canvas.toDataURL("image/png"));
        setCropBox({ x: 0, y: 0, w: 100, h: 100 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  // Aspect ratio preset picker
  const setCropPresetRatio = (preset: string) => {
    setCropAspect(preset);
    if (preset === "free") {
      setCropBox({ x: 10, y: 10, w: 80, h: 80 });
      return;
    }
    const [aspectW, aspectH] = preset.split(":").map(Number);
    const targetRatio = aspectW / aspectH;
    const imgAspect = aspectRatio || 1;

    const boxRatio = targetRatio / imgAspect;

    let w = 80;
    let h = 80;

    if (boxRatio > 1) {
      w = 80;
      h = 80 / boxRatio;
      if (h > 90) {
        h = 90;
        w = h * boxRatio;
      }
    } else {
      h = 80;
      w = 80 * boxRatio;
      if (w > 90) {
        w = 90;
        h = w / boxRatio;
      }
    }

    setCropBox({
      x: Math.max(0, (100 - w) / 2),
      y: Math.max(0, (100 - h) / 2),
      w,
      h,
    });
  };

  // Initialize Object Remover Mask & Overlay Canvas
  const initObjectCanvas = () => {
    if (!imgRef.current) return;
    const nw = imgRef.current.naturalWidth || 800;
    const nh = imgRef.current.naturalHeight || 600;

    if (!maskCanvasRef.current) {
      maskCanvasRef.current = document.createElement("canvas");
    }
    maskCanvasRef.current.width = nw;
    maskCanvasRef.current.height = nh;
    const mctx = maskCanvasRef.current.getContext("2d");
    if (mctx) mctx.clearRect(0, 0, nw, nh);

    if (overlayCanvasRef.current) {
      overlayCanvasRef.current.width = nw;
      overlayCanvasRef.current.height = nh;
      const octx = overlayCanvasRef.current.getContext("2d");
      if (octx) octx.clearRect(0, 0, nw, nh);
    }
  };

  useEffect(() => {
    if (tool?.id === "object" && outputSrc) {
      initObjectCanvas();
    }
  }, [tool?.id, outputSrc]);

  const drawObjectBrushPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const overlayCanvas = overlayCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!overlayCanvas || !maskCanvas) return;

    const rect = overlayCanvas.getBoundingClientRect();
    const scaleX = overlayCanvas.width / rect.width;
    const scaleY = overlayCanvas.height / rect.height;

    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    const radius = (objectBrushSize / 2) * scaleX;

    // Draw on hidden mask canvas (white fill)
    const mctx = maskCanvas.getContext("2d");
    if (mctx) {
      mctx.fillStyle = "#ffffff";
      mctx.beginPath();
      mctx.arc(px, py, radius, 0, Math.PI * 2);
      mctx.fill();
    }

    // Draw on visible overlay canvas (red highlight)
    const octx = overlayCanvas.getContext("2d");
    if (octx) {
      octx.fillStyle = "rgba(82, 82, 82, 0.65)";
      octx.beginPath();
      octx.arc(px, py, radius, 0, Math.PI * 2);
      octx.fill();
    }
  };

  const handleObjectPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsBrushingObject(true);
    drawObjectBrushPoint(e);
  };

  const handleObjectPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isBrushingObject) return;
    drawObjectBrushPoint(e);
  };

  const handleObjectPointerUp = () => {
    setIsBrushingObject(false);
  };

  const clearObjectMask = () => {
    initObjectCanvas();
  };

  const handleRemoveObject = async () => {
    if (!outputSrc || !maskCanvasRef.current) return;
    setProcessing(true);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = outputSrc;
      await new Promise((res) => (img.onload = res));

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const inpainted = inpaint(imgData, maskCanvasRef.current);
        ctx.putImageData(inpainted, 0, 0);
        setOutputSrc(canvas.toDataURL("image/png"));

        // Clear gray brush overlay after inpainting
        clearObjectMask();
      }
    } catch (err) {
      console.error("Object removal error:", err);
    } finally {
      setProcessing(false);
    }
  };

  // Collage Maker Rendering Engine
  const applyCollageProcessing = useCallback(async () => {
    if (tool?.id !== "collage" || collageImages.length === 0) return;
    setProcessing(true);
    try {
      let baseW = 1200;
      let baseH = 1200;
      if (collageAspect === "4:3") { baseW = 1200; baseH = 900; }
      else if (collageAspect === "16:9") { baseW = 1200; baseH = 675; }
      else if (collageAspect === "9:16") { baseW = 675; baseH = 1200; }

      const canvas = document.createElement("canvas");
      canvas.width = baseW;
      canvas.height = baseH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw Background Fill
      ctx.fillStyle = collageBgColor;
      ctx.fillRect(0, 0, baseW, baseH);

      // Pre-load all collage images
      const loadedImgs: (HTMLImageElement | null)[] = await Promise.all(
        collageImages.map(
          (src) =>
            new Promise<HTMLImageElement | null>((res) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => res(img);
              img.onerror = () => res(null);
              img.src = src;
            })
        )
      );

      const validImgs = loadedImgs.filter(Boolean) as HTMLImageElement[];
      if (validImgs.length === 0) return;

      interface Slot { x: number; y: number; w: number; h: number; }
      let slots: Slot[] = [];
      const gap = collageSpacing;

      if (collageLayout === "2x2") {
        const cellW = (baseW - gap * 3) / 2;
        const cellH = (baseH - gap * 3) / 2;
        slots = [
          { x: gap, y: gap, w: cellW, h: cellH },
          { x: gap * 2 + cellW, y: gap, w: cellW, h: cellH },
          { x: gap, y: gap * 2 + cellH, w: cellW, h: cellH },
          { x: gap * 2 + cellW, y: gap * 2 + cellH, w: cellW, h: cellH },
        ];
      } else if (collageLayout === "3x3") {
        const cellW = (baseW - gap * 4) / 3;
        const cellH = (baseH - gap * 4) / 3;
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            slots.push({
              x: gap + c * (cellW + gap),
              y: gap + r * (cellH + gap),
              w: cellW,
              h: cellH,
            });
          }
        }
      } else if (collageLayout === "side") {
        const cellW = (baseW - gap * 3) / 2;
        const cellH = baseH - gap * 2;
        slots = [
          { x: gap, y: gap, w: cellW, h: cellH },
          { x: gap * 2 + cellW, y: gap, w: cellW, h: cellH },
        ];
      } else if (collageLayout === "split") {
        const cellW = baseW - gap * 2;
        const cellH = (baseH - gap * 3) / 2;
        slots = [
          { x: gap, y: gap, w: cellW, h: cellH },
          { x: gap, y: gap * 2 + cellH, w: cellW, h: cellH },
        ];
      } else if (collageLayout === "featured") {
        const leftW = (baseW - gap * 3) * 0.6;
        const rightW = (baseW - gap * 3) * 0.4;
        const fullH = baseH - gap * 2;
        const halfH = (baseH - gap * 3) / 2;
        slots = [
          { x: gap, y: gap, w: leftW, h: fullH },
          { x: gap * 2 + leftW, y: gap, w: rightW, h: halfH },
          { x: gap * 2 + leftW, y: gap * 2 + halfH, w: rightW, h: halfH },
        ];
      }

      slots.forEach((slot, idx) => {
        const img = validImgs[idx % validImgs.length];
        if (!img) return;

        ctx.save();
        ctx.beginPath();
        const r = Math.min(collageRadius, slot.w / 2, slot.h / 2);
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(slot.x, slot.y, slot.w, slot.h, r);
        } else {
          ctx.rect(slot.x, slot.y, slot.w, slot.h);
        }
        ctx.clip();

        const imgRatio = img.naturalWidth / img.naturalHeight;
        const slotRatio = slot.w / slot.h;
        let drawW = slot.w;
        let drawH = slot.h;
        let drawX = slot.x;
        let drawY = slot.y;

        if (imgRatio > slotRatio) {
          drawW = slot.h * imgRatio;
          drawX = slot.x - (drawW - slot.w) / 2;
        } else {
          drawH = slot.w / imgRatio;
          drawY = slot.y - (drawH - slot.h) / 2;
        }

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();
      });

      setOutputSrc(canvas.toDataURL("image/png"));
    } catch (err) {
      console.error("Collage rendering error:", err);
    } finally {
      setProcessing(false);
    }
  }, [collageAspect, collageBgColor, collageImages, collageLayout, collageRadius, collageSpacing, tool?.id]);

  // AI Image Enhancer Function
  const handleEnhance = async () => {
    if (!imageSrc) return;
    setProcessing(true);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageSrc;
      await new Promise((res) => (img.onload = res));

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const enhanced = enhance(imgData, enhanceStrength / 100);
        ctx.putImageData(enhanced, 0, 0);
        setOutputSrc(canvas.toDataURL("image/png"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  // Watermark tool function
  const applyWatermark = useCallback(async () => {
    if (!imageSrc) return;
    try {
      const srcToUse = imageSrc;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = srcToUse;
      await new Promise((res) => (img.onload = res));

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      const W = canvas.width;
      const H = canvas.height;
      const opacityFrac = wmOpacity / 100;

      if (wmMode === "text") {
        if (!wmText.trim()) return;
        ctx.save();
        ctx.globalAlpha = opacityFrac;
        ctx.fillStyle = wmColor;

        const fontSize = Math.max(14, Math.round((wmScale / 100) * (H * 0.15)));
        ctx.font = `bold ${fontSize}px sans-serif`;

        const metrics = ctx.measureText(wmText);
        const textW = metrics.width;
        const textH = fontSize;
        const margin = Math.round(W * 0.04);

        const drawSingleText = (cx: number, cy: number) => {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate((wmRotation * Math.PI) / 180);
          ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
          ctx.shadowBlur = 6;
          ctx.fillText(wmText, -textW / 2, textH / 3);
          ctx.restore();
        };

        if (wmPosition === "tile") {
          const stepX = textW + margin * 3;
          const stepY = textH + margin * 3;
          for (let y = margin + textH; y < H; y += stepY) {
            for (let x = margin + textW / 2; x < W; x += stepX) {
              drawSingleText(x, y);
            }
          }
        } else {
          let cx = W / 2;
          let cy = H / 2;
          if (wmPosition === "bottom-right") {
            cx = W - margin - textW / 2;
            cy = H - margin - textH / 2;
          } else if (wmPosition === "bottom-left") {
            cx = margin + textW / 2;
            cy = H - margin - textH / 2;
          } else if (wmPosition === "top-right") {
            cx = W - margin - textW / 2;
            cy = margin + textH / 2;
          } else if (wmPosition === "top-left") {
            cx = margin + textW / 2;
            cy = margin + textH / 2;
          } else if (wmPosition === "center") {
            cx = W / 2;
            cy = H / 2;
          }
          drawSingleText(cx, cy);
        }
        ctx.restore();
      } else if (wmMode === "logo") {
        if (!wmLogoSrc) {
          return;
        }
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.src = wmLogoSrc;
        await new Promise((res) => (logoImg.onload = res));

        ctx.save();
        ctx.globalAlpha = opacityFrac;

        const logoAspect = logoImg.naturalWidth / logoImg.naturalHeight;
        const targetW = Math.max(20, Math.round((wmScale / 100) * W * 0.4));
        const targetH = targetW / logoAspect;
        const margin = Math.round(W * 0.04);

        const drawSingleLogo = (cx: number, cy: number) => {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate((wmRotation * Math.PI) / 180);
          ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
          ctx.shadowBlur = 6;
          ctx.drawImage(logoImg, -targetW / 2, -targetH / 2, targetW, targetH);
          ctx.restore();
        };

        if (wmPosition === "tile") {
          const stepX = targetW + margin * 2;
          const stepY = targetH + margin * 2;
          for (let y = margin + targetH / 2; y < H; y += stepY) {
            for (let x = margin + targetW / 2; x < W; x += stepX) {
              drawSingleLogo(x, y);
            }
          }
        } else {
          let cx = W / 2;
          let cy = H / 2;
          if (wmPosition === "bottom-right") {
            cx = W - margin - targetW / 2;
            cy = H - margin - targetH / 2;
          } else if (wmPosition === "bottom-left") {
            cx = margin + targetW / 2;
            cy = H - margin - targetH / 2;
          } else if (wmPosition === "top-right") {
            cx = W - margin - targetW / 2;
            cy = margin + targetH / 2;
          } else if (wmPosition === "top-left") {
            cx = margin + targetW / 2;
            cy = margin + targetH / 2;
          } else if (wmPosition === "center") {
            cx = W / 2;
            cy = H / 2;
          }
          drawSingleLogo(cx, cy);
        }
        ctx.restore();
      }

      setOutputSrc(canvas.toDataURL("image/png"));
    } catch (err) {
      console.error("Watermark error:", err);
    }
  }, [imageSrc, wmColor, wmLogoSrc, wmMode, wmOpacity, wmPosition, wmRotation, wmScale, wmText]);

  // Background Removal: Auto Mode
  const runAutoBgRemove = async () => {
    if (!outputSrc && !imageSrc) return;
    setProcessing(true);
    try {
      const srcToUse = outputSrc || imageSrc;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = srcToUse!;
      await new Promise((res) => (img.onload = res));

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const resData = removeByBorders(imgData, bgTolerance, bgFeather, bgWhole);
        ctx.putImageData(resData, 0, 0);
        setOutputSrc(canvas.toDataURL("image/png"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  // Background Removal: Magic Wand Click
  const handleWandClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (tool?.id !== "bgremove" || bgSubMode !== "wand" || !outputSrc) return;
    const imgEl = imgRef.current;
    if (!imgEl) return;

    const rect = imgEl.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const scaleX = imgEl.naturalWidth / rect.width;
    const scaleY = imgEl.naturalHeight / rect.height;

    const px = clickX * scaleX;
    const py = clickY * scaleY;

    setProcessing(true);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = outputSrc;
      await new Promise((res) => (img.onload = res));

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const resData = magicWandRemove(imgData, px, py, bgTolerance, bgFeather, bgWhole);
        ctx.putImageData(resData, 0, 0);
        setOutputSrc(canvas.toDataURL("image/png"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  // Restore Full Image
  const handleRestoreFull = () => {
    if (imageSrc) {
      setOutputSrc(imageSrc);
    }
  };

  const applyProcessing = useCallback(() => {
    if (!imageSrc) return;
    setProcessing(true);
    const outputFormat = FIXED_CONVERTER_FORMAT[tool?.id ?? "convert"] ?? format;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const targetW = width || img.naturalWidth;
      const targetH = height || img.naturalHeight;

      if (rotation % 180 !== 0) {
        canvas.width = targetH;
        canvas.height = targetW;
      } else {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const ctx = canvas.getContext("2d");
      if (ctx) {
        let mimeType = "image/jpeg";
        if (outputFormat === "png") mimeType = "image/png";
        if (outputFormat === "jpeg") mimeType = "image/jpeg";
        if (outputFormat === "webp") mimeType = "image/webp";

        if (tool?.id === "compress" && mimeType === "image/png") {
          mimeType = "image/jpeg";
        }

        if (mimeType === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);

        let filterStr = `brightness(${100 + brightness + exposure}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%)`;
        if (hueRotate !== 0) filterStr += ` hue-rotate(${hueRotate}deg)`;
        if (sepia > 0) filterStr += ` sepia(${sepia}%)`;
        if (grayscale > 0) filterStr += ` grayscale(${grayscale}%)`;
        if (invert > 0) filterStr += ` invert(${invert}%)`;
        if (blur > 0) filterStr += ` blur(${blur}px)`;

        if (tool?.id === "filters") {
          const selected = PHOTO_FILTERS.find((f) => f.id === filterPreset);
          if (selected && selected.filter !== "none") {
            filterStr += ` ${selected.filter}`;
          }
        }

        ctx.filter = filterStr;
        ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
        ctx.restore();

        const q = quality / 100;
        setOutputSrc(canvas.toDataURL(mimeType, q));
      }
      setProcessing(false);
    };
    img.src = imageSrc;
  }, [
    blur,
    brightness,
    contrast,
    exposure,
    filterPreset,
    format,
    grayscale,
    height,
    hueRotate,
    imageSrc,
    invert,
    quality,
    rotation,
    saturation,
    sepia,
    tool?.id,
    width,
  ]);

  // Live preview effects run after the rendering callbacks are defined.
  useEffect(() => {
    if (tool?.id === "watermark" && imageSrc) {
      const id = window.setTimeout(() => void applyWatermark(), 0);
      return () => window.clearTimeout(id);
    }
  }, [applyWatermark, imageSrc, tool?.id]);

  useEffect(() => {
    if ((tool?.id === "filters" || tool?.id === "adjust" || tool?.id === "compress") && imageSrc) {
      const id = window.setTimeout(() => applyProcessing(), 0);
      return () => window.clearTimeout(id);
    }
  }, [applyProcessing, imageSrc, tool?.id]);

  useEffect(() => {
    if (tool?.id === "collage" && collageImages.length > 0) {
      const id = window.setTimeout(() => void applyCollageProcessing(), 0);
      return () => window.clearTimeout(id);
    }
  }, [applyCollageProcessing, collageImages.length, tool?.id]);

  const handleDownload = () => {
    if (!outputSrc || !tool) return;
    const a = document.createElement("a");
    const downloadFormat = FIXED_CONVERTER_FORMAT[tool.id] ?? format;
    const ext = downloadFormat === "jpeg" ? "jpg" : downloadFormat;
    const name = imageFile?.name ? imageFile.name.replace(/\.[^/.]+$/, "") : "pixo-edited";
    a.href = outputSrc;
    a.download = `${name}-${tool.id}.${ext}`;
    a.click();
  };

  useEffect(() => {
    if (!tool) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, tool]);

  if (!tool) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171717]/35 backdrop-blur-[2px] animate-fadeup"
      role="dialog"
      aria-modal="true"
      aria-label={tool.label}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-lg border border-[#d4d4d4] bg-[#ffffff] shadow-[0_24px_70px_rgba(0,0,0,0.18)] overflow-hidden">
        {/* Monochrome tool header */}
        <div className="flex h-16 items-center justify-between border-b border-[#d4d4d4] px-6 bg-[#fafafa] backdrop-blur-xl">
          <div className="flex items-center gap-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-[#a3a3a3] bg-[#eeeeee] text-[#171717] shadow-[0_0_20px_rgba(212,212,212,0.3)]">
              <Icon name={tool.icon} size={18} />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-[#171717] tracking-tight flex items-center gap-2">
                {tool.id === "watermark" ? "Watermark Tool" : tool.label}
                <span className="rounded-full bg-[#e5e5e5] border border-[#a3a3a3] px-2 py-0.5 text-[10px] font-bold text-[#171717] tracking-wider uppercase">Local Tool</span>
              </h3>
              <p className="text-[11px] font-medium text-[#737373]">{tool.category} - Browser Engine</p>
            </div>
          </div>
          <button
            type="button"
            aria-label={`Close ${tool.label}`}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[#d4d4d4] bg-[#fafafa] text-[#525252] hover:bg-[#fafafa] hover:text-[#171717] hover:border-[#a3a3a3] transition-all"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-1 flex-col overflow-y-auto p-6 scroll-thin">
          {isDocumentConverter(tool.id) ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="group flex min-h-[340px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#d4d4d4] bg-[#fafafa] p-8 text-center transition-all duration-200 hover:border-[#171717] hover:bg-[#eeeeee] md:col-span-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={documentAccept(tool.id)}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg border border-[#a3a3a3] bg-[#eeeeee] text-[#171717] shadow-[0_0_25px_rgba(212,212,212,0.25)] transition-transform group-hover:scale-110">
                  <Icon name="upload" size={30} />
                </span>
                <h4 className="text-base font-bold text-[#171717]">
                  {DOCUMENT_CONVERTER_COPY[tool.id].uploadTitle}
                </h4>
                <p className="mt-2 max-w-sm text-xs leading-relaxed text-[#737373]">
                  {DOCUMENT_CONVERTER_COPY[tool.id].description}
                </p>
                {documentFile && (
                  <div className="mt-5 w-full max-w-md rounded-md border border-[#d4d4d4] bg-[#fafafa] p-3 text-left">
                    <p className="truncate text-sm font-extrabold text-[#171717]">{documentFile.name}</p>
                    <p className="mt-1 text-xs text-[#525252]">{formatBytes(documentFile.size)}</p>
                    {documentStatus && <p className="mt-2 text-xs font-bold text-[#171717]">{documentStatus}</p>}
                    {documentError && <p className="mt-2 text-xs font-bold text-[#404040]">{documentError}</p>}
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between rounded-lg border border-[#d4d4d4] bg-[#ffffff] p-5">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#171717]">
                    {DOCUMENT_CONVERTER_COPY[tool.id].outputTitle}
                  </h4>
                  <p className="mt-2 text-xs leading-relaxed text-[#525252]">
                    {DOCUMENT_CONVERTER_COPY[tool.id].note}
                  </p>

                  <div className="mt-4 max-h-[260px] overflow-y-auto rounded-md border border-[#d4d4d4] bg-[#fafafa] p-3 text-xs leading-relaxed text-[#525252]">
                    {documentPreview || "Converted text preview will appear here."}
                  </div>
                </div>

                <div className="mt-5 space-y-2 border-t border-[#d4d4d4] pt-4">
                  {documentOutputUrl ? (
                    <a
                      href={documentOutputUrl}
                      download={documentOutputName}
                      className="flex w-full items-center justify-center gap-2 rounded-md bg-[#171717] px-4 py-3 text-xs font-extrabold tracking-wide text-white shadow-lg shadow-black/10 transition-all hover:brightness-110 active:scale-[0.98]"
                    >
                      <Icon name="download" size={15} />
                      Download {DOCUMENT_CONVERTER_COPY[tool.id].downloadLabel}
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex w-full cursor-not-allowed items-center justify-center rounded-md border border-[#d4d4d4] bg-[#fafafa] px-4 py-3 text-xs font-bold text-[#737373]"
                    >
                      Waiting for document
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-md border border-[#d4d4d4] bg-[#fafafa] py-2.5 text-xs font-semibold text-[#525252] transition-all hover:border-[#a3a3a3] hover:bg-[#eeeeee] hover:text-[#171717]"
                  >
                    Choose Different Document
                  </button>
                </div>
              </div>
            </div>
          ) : !imageSrc ? (
            /* Modern Upload Drop Zone */
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="group flex min-h-[340px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#d4d4d4] hover:border-[#171717] bg-[#fafafa] hover:bg-[#eeeeee] p-8 text-center cursor-pointer transition-all duration-200"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple={tool.id === "collage"}
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="flex h-16 w-16 items-center justify-center rounded-lg border border-[#a3a3a3] bg-[#eeeeee] text-[#171717] mb-4 group-hover:scale-110 shadow-[0_0_25px_rgba(212,212,212,0.25)] transition-transform">
                <Icon name="upload" size={30} />
              </span>
              <h4 className="text-base font-bold text-[#171717]">
                {tool.id === "collage" ? "Drop photo(s) here or browse" : "Drop your photo here or browse"}
              </h4>
              <p className="mt-2 text-xs text-[#737373] max-w-sm leading-relaxed">
                {tool.id === "collage"
                  ? "Select multiple photos to generate custom grids (2x2, 3x3, side-by-side, split)."
                  : "Supports PNG, JPG, WebP, SVG. 100% private — processed locally inside your browser memory."}
              </p>
            </div>
          ) : (
            /* Tool Workspace Interface */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Image Canvas Preview */}
              <div className="md:col-span-2 flex flex-col items-center justify-center rounded-lg border border-[#d4d4d4] bg-[#fafafa] p-4 min-h-[340px] relative overflow-hidden shadow-inner">
                <div
                  className="checkerboard absolute inset-0 opacity-20"
                  style={{ backgroundSize: "16px 16px" }}
                />
                {outputSrc ? (
                  <div ref={imgContainerRef} className="relative inline-block max-h-[400px] max-w-full">
                    <img
                      ref={imgRef}
                      src={outputSrc}
                      alt="Preview"
                      onClick={handleWandClick}
                      style={{
                        cursor: tool.id === "bgremove" && bgSubMode === "wand" ? "crosshair" : "default",
                        transform: `rotate(${rotation}deg)`,
                        transition: "transform 0.15s ease-out",
                      }}
                      className="max-h-[400px] w-auto max-w-full object-contain rounded-md shadow-2xl relative z-10 select-none block"
                    />

                    {/* Interactive Object Remover Brush Canvas Overlay */}
                    {tool.id === "object" && (
                      <canvas
                        ref={overlayCanvasRef}
                        onPointerDown={handleObjectPointerDown}
                        onPointerMove={handleObjectPointerMove}
                        onPointerUp={handleObjectPointerUp}
                        onPointerLeave={handleObjectPointerUp}
                        className="absolute inset-0 z-20 cursor-crosshair touch-none w-full h-full rounded-md"
                      />
                    )}

                    {/* Interactive Crop Box Overlay */}
                    {tool.id === "crop" && cropSubMode === "crop" && (
                      <div
                        onPointerMove={handleCropPointerMove}
                        onPointerUp={handleCropPointerUp}
                        className="absolute inset-0 z-20 overflow-hidden pointer-events-auto"
                      >
                        <div
                          className="absolute left-0 top-0 w-full bg-black/60 pointer-events-none"
                          style={{ height: `${cropBox.y}%` }}
                        />
                        <div
                          className="absolute left-0 w-full bg-black/60 pointer-events-none"
                          style={{ top: `${cropBox.y + cropBox.h}%`, bottom: 0 }}
                        />
                        <div
                          className="absolute left-0 bg-black/60 pointer-events-none"
                          style={{ top: `${cropBox.y}%`, height: `${cropBox.h}%`, width: `${cropBox.x}%` }}
                        />
                        <div
                          className="absolute bg-black/60 pointer-events-none"
                          style={{
                            left: `${cropBox.x + cropBox.w}%`,
                            right: 0,
                            top: `${cropBox.y}%`,
                            height: `${cropBox.h}%`,
                          }}
                        />

                        <div
                          onPointerDown={(e) => handleCropPointerDown(e, "move")}
                          className="absolute border-2 border-[#171717] cursor-move shadow-[0_0_15px_rgba(212,212,212,0.4)]"
                          style={{
                            left: `${cropBox.x}%`,
                            top: `${cropBox.y}%`,
                            width: `${cropBox.w}%`,
                            height: `${cropBox.h}%`,
                          }}
                        >
                          <div className="pointer-events-none absolute inset-0">
                            <div className="absolute left-1/3 top-0 h-full w-px bg-white/30" />
                            <div className="absolute left-2/3 top-0 h-full w-px bg-white/30" />
                            <div className="absolute top-1/3 left-0 h-px w-full bg-white/30" />
                            <div className="absolute top-2/3 left-0 h-px w-full bg-white/30" />
                          </div>

                          {CROP_HANDLES.map((h) => (
                            <div
                              key={h.id}
                              onPointerDown={(e) => handleCropPointerDown(e, h.id)}
                              style={{
                                left: `${h.x * 100}%`,
                                top: `${h.y * 100}%`,
                                cursor: h.cursor,
                              }}
                              className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-[3px] border-2 border-[#171717] bg-white shadow-lg hover:scale-125 transition-transform"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs font-medium text-[#737373]">Loading canvas...</div>
                )}

                {processing && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#ffffff]/85 backdrop-blur-[2px]">
                    <span className="text-xs font-bold text-[#171717] tracking-wider uppercase animate-pulse flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#171717] animate-ping" />
                      Processing local canvas...
                    </span>
                  </div>
                )}
              </div>

              <BorderGlow
                edgeSensitivity={0}
                glowColor="0 0 55"
                backgroundColor="#ffffff"
                borderRadius={8}
                glowRadius={8}
                glowIntensity={0.7}
                coneSpread={35}
                animated={true}
                colors={["#d4d4d4", "#a3a3a3", "#737373"]}
                className="w-full h-full overflow-hidden"
              >
                <div className="flex flex-col justify-between gap-5 h-full max-h-[520px] p-5 overflow-y-auto overflow-x-hidden scroll-thin">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#d4d4d4] pb-2.5">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#171717] flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#171717] shadow-[0_0_8px_#d4d4d4]" />
                        {tool.id === "watermark" ? "Watermark Tool" : `${tool.label}`}
                      </h4>
                    </div>

                  {/* Crop Tool & Rotate Controls */}
                  {tool.id === "crop" && (
                    <div className="space-y-4">
                      <div className="flex rounded-md border border-border/80 bg-[#fafafa] p-1 gap-1 shadow-inner">
                        <button
                          onClick={() => setCropSubMode("crop")}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                            cropSubMode === "crop"
                              ? "bg-[#171717] text-[#ffffff] shadow-md shadow-black/10"
                              : "text-[#525252] hover:text-[#171717] hover:bg-[#eeeeee]"
                          }`}
                        >
                          Crop Tool
                        </button>
                        <button
                          onClick={() => setCropSubMode("rotate")}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                            cropSubMode === "rotate"
                              ? "bg-[#171717] text-[#ffffff] shadow-md shadow-black/10"
                              : "text-[#525252] hover:text-[#171717] hover:bg-[#eeeeee]"
                          }`}
                        >
                          Rotate Tool
                        </button>
                      </div>

                      {cropSubMode === "crop" && (
                        <div className="space-y-4">
                          <p className="text-xs text-[#525252] leading-relaxed">
                            Drag the crop box handles directly on the preview image.
                          </p>

                          <label className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">
                            Aspect Ratio Presets
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: "free", label: "Freeform" },
                              { id: "1:1", label: "1:1 Square" },
                              { id: "16:9", label: "16:9 Wide" },
                              { id: "4:3", label: "4:3 Standard" },
                              { id: "9:16", label: "9:16 Story" },
                            ].map((preset) => (
                              <button
                                key={preset.id}
                                onClick={() => setCropPresetRatio(preset.id)}
                                className={`rounded-lg border px-2 py-2 text-[11px] font-bold transition-all ${
                                  cropAspect === preset.id
                                    ? "border-[#171717] bg-[#e5e5e5] text-[#171717] shadow-sm"
                                    : "border-border/80 bg-[#fafafa] text-[#525252] hover:bg-[#ffffff] hover:text-[#171717]"
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={executeCrop}
                            disabled={processing}
                            className="w-full flex items-center justify-center gap-2 rounded-md bg-[#171717] px-4 py-3 text-xs font-bold text-white shadow-lg shadow-black/10 hover:brightness-110 active:scale-[0.98] transition-all mt-2"
                          >
                            <Icon name="crop" size={15} />
                            Apply Interactive Crop
                          </button>
                        </div>
                      )}

                      {cropSubMode === "rotate" && (
                        <div className="space-y-4">
                          <p className="text-xs text-[#525252] leading-relaxed">
                            Rotate the image interactively using 5 deg step sliders or quick rotation buttons.
                          </p>

                          <div className="space-y-3">
                            <Slider
                              label="Rotation Angle"
                              value={rotation}
                              min={-180}
                              max={180}
                              step={5}
                              unit=" deg"
                              onChange={setRotation}
                            />

                            <div className="flex gap-2">
                              <button
                                onClick={() => setRotation((r) => r - 90)}
                                className="flex-1 rounded-md border border-border/80 bg-[#fafafa] py-2 text-xs font-semibold text-[#171717] hover:bg-[#ffffff] hover:border-border transition-all"
                              >
                                -90 deg
                              </button>
                              <button
                                onClick={() => setRotation(0)}
                                className="flex-1 rounded-md border border-border/80 bg-[#fafafa] py-2 text-xs font-bold text-[#737373] hover:text-[#171717] hover:bg-[#ffffff] transition-all"
                              >
                                Reset 0 deg
                              </button>
                              <button
                                onClick={() => setRotation((r) => r + 90)}
                                className="flex-1 rounded-md border border-border/80 bg-[#fafafa] py-2 text-xs font-semibold text-[#171717] hover:bg-[#ffffff] hover:border-border transition-all"
                              >
                                +90 deg
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={applyProcessing}
                            disabled={processing}
                            className="w-full flex items-center justify-center gap-2 rounded-md bg-[#171717] px-4 py-3 text-xs font-bold text-white shadow-lg shadow-black/10 hover:brightness-110 active:scale-[0.98] transition-all mt-2"
                          >
                            <Icon name="sparkle" size={15} />
                            Apply Rotation
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Image Enhancer */}
                  {tool.id === "enhance" && (
                    <div className="space-y-4">
                      <p className="text-xs text-[#525252] leading-relaxed">
                        White balance, contrast stretching, and unsharp mask sharpening algorithms.
                      </p>
                      <Slider
                        label="Enhance Strength"
                        value={enhanceStrength}
                        min={10}
                        max={100}
                        unit="%"
                        onChange={setEnhanceStrength}
                      />
                      <button
                        onClick={handleEnhance}
                        disabled={processing}
                        className="w-full flex items-center justify-center gap-2 rounded-md bg-[#171717] px-4 py-3 text-xs font-bold text-white shadow-lg shadow-black/10 hover:brightness-110 active:scale-[0.98] transition-all mt-2"
                      >
                        <Icon name="sparkle" size={15} />
                        Auto-Enhance Photo
                      </button>
                    </div>
                  )}

                  {/* Background Removal */}
                  {tool.id === "bgremove" && (
                    <div className="space-y-4">
                      <div className="flex rounded-md border border-border/80 bg-[#fafafa] p-1 gap-1 shadow-inner">
                        <button
                          onClick={() => setBgSubMode("auto")}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                            bgSubMode === "auto"
                              ? "bg-[#171717] text-[#ffffff] shadow-md shadow-black/10"
                              : "text-[#525252] hover:text-[#171717] hover:bg-[#eeeeee]"
                          }`}
                        >
                          Auto
                        </button>
                        <button
                          onClick={() => setBgSubMode("wand")}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                            bgSubMode === "wand"
                              ? "bg-[#171717] text-[#ffffff] shadow-md shadow-black/10"
                              : "text-[#525252] hover:text-[#171717] hover:bg-[#eeeeee]"
                          }`}
                        >
                          Magic Wand
                        </button>
                        <button
                          onClick={() => setBgSubMode("brush")}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                            bgSubMode === "brush"
                              ? "bg-[#171717] text-[#ffffff] shadow-md shadow-black/10"
                              : "text-[#525252] hover:text-[#171717] hover:bg-[#eeeeee]"
                          }`}
                        >
                          Manual Brush
                        </button>
                      </div>

                      {bgSubMode === "auto" && (
                        <div className="space-y-3">
                          <p className="text-xs text-[#525252] leading-relaxed">
                            Auto edge-detection analyzes background borders and keys out matching colors.
                          </p>
                          <button
                            onClick={runAutoBgRemove}
                            disabled={processing}
                            className="w-full flex items-center justify-center gap-2 rounded-md bg-[#171717] px-4 py-3 text-xs font-bold text-white shadow-lg shadow-black/10 hover:brightness-110 active:scale-[0.98] transition-all"
                          >
                            <Icon name="sparkle" size={15} />
                            Auto Remove Background
                          </button>
                        </div>
                      )}

                      {bgSubMode === "wand" && (
                        <div className="space-y-3">
                          <p className="text-xs text-[#525252] leading-relaxed">
                            Click directly on any background color in the preview image to key it out.
                          </p>
                          <Slider
                            label="Tolerance"
                            value={bgTolerance}
                            min={5}
                            max={90}
                            unit="%"
                            onChange={setBgTolerance}
                          />
                          <Slider
                            label="Edge Feather"
                            value={bgFeather}
                            min={0}
                            max={8}
                            unit="px"
                            onChange={setBgFeather}
                          />
                          <label className="flex items-start gap-2 text-xs text-[#525252] cursor-pointer pt-1">
                            <input
                              type="checkbox"
                              checked={bgWhole}
                              onChange={(e) => setBgWhole(e.target.checked)}
                              className="mt-0.5 rounded border-border bg-[#fafafa] accent-[#171717]"
                            />
                            <span>Remove matching colors globally</span>
                          </label>
                        </div>
                      )}

                      {bgSubMode === "brush" && (
                        <div className="space-y-3">
                          <p className="text-xs text-[#525252] leading-relaxed">
                            Fine-tune edges by hand using erase or restore mode.
                          </p>
                          <div className="flex rounded-lg border border-border bg-[#fafafa] p-1 gap-1">
                            <button
                              onClick={() => setBgBrushMode("erase")}
                              className={`flex-1 py-1.5 text-xs font-bold rounded ${
                                bgBrushMode === "erase" ? "bg-[#e5e5e5] text-[#171717]" : "text-[#525252]"
                              }`}
                            >
                              Erase Mode
                            </button>
                            <button
                              onClick={() => setBgBrushMode("restore")}
                              className={`flex-1 py-1.5 text-xs font-bold rounded ${
                                bgBrushMode === "restore" ? "bg-[#e5e5e5] text-[#171717]" : "text-[#525252]"
                              }`}
                            >
                              Restore Mode
                            </button>
                          </div>
                          <Slider
                            label="Brush Size"
                            value={brushSize}
                            min={8}
                            max={140}
                            unit="px"
                            onChange={setBrushSize}
                          />
                        </div>
                      )}

                      <button
                        onClick={handleRestoreFull}
                        className="w-full rounded-md border border-border/80 bg-[#fafafa] py-2.5 text-xs font-semibold text-[#525252] hover:text-[#171717] hover:border-border transition-all"
                      >
                        Restore Full Original Image
                      </button>
                    </div>
                  )}

                  {/* Object Remover */}
                  {tool.id === "object" && (
                    <div className="space-y-4">
                      <p className="text-xs text-[#525252] leading-relaxed">
                        Brush directly over any unwanted object or distraction in gray on the preview image, then click <strong className="text-[#171717]">Remove Object</strong>.
                      </p>
                      <Slider
                        label="Brush Size"
                        value={objectBrushSize}
                        min={10}
                        max={100}
                        unit="px"
                        onChange={setObjectBrushSize}
                      />
                      <button
                        onClick={handleRemoveObject}
                        disabled={processing}
                        className="w-full flex items-center justify-center gap-2 rounded-md bg-[#171717] px-4 py-3 text-xs font-bold text-white shadow-lg shadow-black/10 hover:brightness-110 active:scale-[0.98] transition-all mt-2"
                      >
                        <Icon name="sparkle" size={15} />
                        Remove Object
                      </button>
                      <button
                        onClick={clearObjectMask}
                        disabled={processing}
                        className="w-full rounded-md border border-border/80 bg-[#fafafa] py-2.5 text-xs font-semibold text-[#525252] hover:text-[#171717] hover:border-border transition-all"
                      >
                        Clear Red Brush Strokes
                      </button>
                    </div>
                  )}

                  {tool.id === "resize" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">Width (px)</label>
                          <input
                            type="number"
                            value={width}
                            onChange={(e) => handleWidthChange(Number(e.target.value))}
                            className="w-full rounded-md border border-border/80 bg-[#fafafa] px-3 py-2 text-xs font-semibold text-[#171717] focus:border-[#171717] focus:outline-none mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">Height (px)</label>
                          <input
                            type="number"
                            value={height}
                            onChange={(e) => handleHeightChange(Number(e.target.value))}
                            className="w-full rounded-md border border-border/80 bg-[#fafafa] px-3 py-2 text-xs font-semibold text-[#171717] focus:border-[#171717] focus:outline-none mt-1"
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-[#525252] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={keepAspect}
                          onChange={(e) => setKeepAspect(e.target.checked)}
                          className="rounded border-border bg-[#fafafa] accent-[#171717]"
                        />
                        Lock Aspect Ratio
                      </label>
                      <button
                        onClick={applyProcessing}
                        className="w-full rounded-md bg-[#171717] px-4 py-3 text-xs font-bold text-white shadow-lg shadow-black/10 hover:brightness-110 active:scale-[0.98] transition-all"
                      >
                        Apply Dimensions
                      </button>
                    </div>
                  )}

                  {tool.id === "compress" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">
                          Compression Format
                        </label>
                        <div className="flex gap-2 mt-1">
                          {(["jpeg", "webp"] as const).map((fmt) => (
                            <button
                              key={fmt}
                              onClick={() => setFormat(fmt)}
                              className={`flex-1 rounded-md border py-2 text-xs uppercase font-bold transition-all ${
                                format === fmt
                                  ? "border-[#171717] bg-[#e5e5e5] text-[#171717] shadow-sm"
                                  : "border-border/80 bg-[#fafafa] text-[#525252] hover:bg-[#ffffff]"
                              }`}
                            >
                              {fmt === "jpeg" ? "JPEG (Standard)" : "WebP (Best)"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Slider
                        label="Compression Quality"
                        value={quality}
                        min={10}
                        max={95}
                        unit="%"
                        onChange={setQuality}
                      />

                      {/* Live File Size Reduction Card */}
                      {imageFile && outputSrc && (
                        <div className="rounded-md border border-border/80 bg-[#fafafa] p-3.5 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#525252] font-medium">Original Size:</span>
                            <span className="text-[#171717] font-bold">{formatBytes(imageFile.size)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#525252] font-medium">Compressed Size:</span>
                            <span className="text-[#171717] font-extrabold">{formatBytes(Math.round((outputSrc.length * 3) / 4))}</span>
                          </div>
                          {imageFile.size > 0 && Math.round((outputSrc.length * 3) / 4) < imageFile.size ? (
                            <div className="mt-2 text-center rounded-lg border border-[#a3a3a3] bg-[#e5e5e5] py-1.5 px-2 text-xs font-bold text-[#171717]">
                              Saved {Math.round((1 - Math.round((outputSrc.length * 3) / 4) / imageFile.size) * 100)}% of file size!
                            </div>
                          ) : (
                            <div className="mt-2 text-center rounded-lg bg-[#eeeeee] border border-[#a3a3a3] py-1.5 px-2 text-xs font-semibold text-[#171717]">
                              Slide quality to reduce file size
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Watermark tool controls */}
                  {tool.id === "watermark" && (
                    <div className="space-y-4">
                      <div className="flex rounded-md border border-border/80 bg-[#fafafa] p-1 gap-1 shadow-inner">
                        <button
                          onClick={() => setWmMode("text")}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                            wmMode === "text"
                              ? "bg-[#171717] text-[#ffffff] shadow-md shadow-black/10"
                              : "text-[#525252] hover:text-[#171717] hover:bg-[#eeeeee]"
                          }`}
                        >
                          Text Stamp
                        </button>
                        <button
                          onClick={() => setWmMode("logo")}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                            wmMode === "logo"
                              ? "bg-[#171717] text-[#ffffff] shadow-md shadow-black/10"
                              : "text-[#525252] hover:text-[#171717] hover:bg-[#eeeeee]"
                          }`}
                        >
                          Logo Image
                        </button>
                      </div>

                      {wmMode === "text" && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">
                              Watermark Text
                            </label>
                            <input
                              type="text"
                              value={wmText}
                              onChange={(e) => setWmText(e.target.value)}
                              placeholder="e.g. Pixo Local"
                              className="w-full rounded-md border border-border/80 bg-[#fafafa] px-3 py-2 text-xs font-semibold text-[#171717] focus:border-[#171717] focus:outline-none mt-1"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">
                              Text Color
                            </label>
                            <div className="flex items-center gap-2 mt-1">
                              {["#ffffff", "#d4d4d4", "#a3a3a3", "#737373", "#404040", "#000000"].map((c) => (
                                <button
                                  key={c}
                                  onClick={() => setWmColor(c)}
                                  style={{ backgroundColor: c }}
                                  className={`h-7 w-7 rounded-lg border transition-all ${
                                    wmColor === c ? "border-[#171717] ring-2 ring-[#a3a3a3] scale-110" : "border-border"
                                  }`}
                                />
                              ))}
                              <input
                                type="color"
                                value={wmColor}
                                onChange={(e) => setWmColor(e.target.value)}
                                className="h-7 w-7 cursor-pointer rounded-lg border border-border bg-transparent p-0"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {wmMode === "logo" && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">
                              Upload Logo (PNG / Transparent)
                            </label>
                            <input
                              ref={wmLogoInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleWmLogoSelect}
                              className="hidden"
                            />
                            <button
                              onClick={() => wmLogoInputRef.current?.click()}
                              className="w-full flex items-center justify-center gap-2 rounded-md border border-border/80 bg-[#fafafa] py-2.5 text-xs font-bold text-[#171717] hover:bg-[#ffffff] hover:border-[#171717] transition-all mt-1"
                            >
                              <Icon name="upload" size={15} />
                              {wmLogoSrc ? "Change Logo Image" : "Choose Logo Image"}
                            </button>
                            {wmLogoSrc && (
                              <div className="mt-2 flex items-center gap-2 rounded-md border border-border bg-[#fafafa] p-2">
                                <img src={wmLogoSrc} alt="Logo Preview" className="h-8 w-8 object-contain rounded-lg" />
                                <span className="text-xs text-[#171717] font-bold truncate">Logo loaded</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">
                          Stamp Position
                        </label>
                        <select
                          value={wmPosition}
                          onChange={(e) => setWmPosition(e.target.value as WatermarkPosition)}
                          className="w-full rounded-md border border-border/80 bg-[#fafafa] px-3 py-2 text-xs font-semibold text-[#171717] focus:border-[#171717] focus:outline-none mt-1"
                        >
                          <option value="bottom-right">Bottom Right</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="top-right">Top Right</option>
                          <option value="top-left">Top Left</option>
                          <option value="center">Center</option>
                          <option value="tile">Tile Pattern</option>
                        </select>
                      </div>

                      <div className="space-y-3 pt-1 border-t border-border/50">
                        <Slider
                          label="Opacity"
                          value={wmOpacity}
                          min={10}
                          max={100}
                          unit="%"
                          onChange={setWmOpacity}
                        />
                        <Slider
                          label="Scale / Size"
                          value={wmScale}
                          min={5}
                          max={100}
                          unit="%"
                          onChange={setWmScale}
                        />
                        <Slider
                          label="Rotation Angle"
                          value={wmRotation}
                          min={-180}
                          max={180}
                          step={5}
                          unit=" deg"
                          onChange={setWmRotation}
                        />
                      </div>
                    </div>
                  )}

                  {tool.id === "filters" && (
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">
                        Filter Gallery (Live Preview)
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1 scroll-thin">
                        {PHOTO_FILTERS.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => setFilterPreset(preset.id)}
                            className={`group flex flex-col items-center gap-1.5 rounded-md border p-1.5 transition-all text-left ${
                              filterPreset === preset.id
                                ? "border-[#171717] bg-[#e5e5e5] ring-1 ring-[#a3a3a3] shadow-md"
                                : "border-border/80 bg-[#fafafa] hover:border-border hover:bg-[#ffffff]"
                            }`}
                          >
                            <div className="relative h-14 w-full overflow-hidden rounded-lg bg-[#eeeeee]">
                              <img
                                src={imageSrc}
                                alt={preset.label}
                                style={{ filter: preset.filter }}
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              />
                            </div>
                            <span
                              className={`text-[11px] font-bold truncate w-full text-center ${
                                filterPreset === preset.id ? "text-[#171717]" : "text-[#525252] group-hover:text-[#171717]"
                              }`}
                            >
                              {preset.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {tool.id === "adjust" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <label className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">
                          Color Controls (Live Preview)
                        </label>
                        <button
                          onClick={resetAdjustments}
                          className="text-[11px] font-bold text-[#171717] hover:underline"
                        >
                          Reset All
                        </button>
                      </div>

                      <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 scroll-thin">
                        <Slider
                          label="Brightness"
                          value={brightness}
                          min={-50}
                          max={50}
                          onChange={setBrightness}
                        />
                        <Slider
                          label="Contrast"
                          value={contrast}
                          min={-50}
                          max={50}
                          onChange={setContrast}
                        />
                        <Slider
                          label="Saturation"
                          value={saturation}
                          min={-50}
                          max={50}
                          onChange={setSaturation}
                        />
                        <Slider
                          label="Exposure"
                          value={exposure}
                          min={-50}
                          max={50}
                          onChange={setExposure}
                        />
                        <Slider
                          label="Hue Shift"
                          value={hueRotate}
                          min={-180}
                          max={180}
                          step={5}
                          unit=" deg"
                          onChange={setHueRotate}
                        />
                        <Slider
                          label="Sepia Warmth"
                          value={sepia}
                          min={0}
                          max={100}
                          unit="%"
                          onChange={setSepia}
                        />
                        <Slider
                          label="Grayscale"
                          value={grayscale}
                          min={0}
                          max={100}
                          unit="%"
                          onChange={setGrayscale}
                        />
                        <Slider
                          label="Invert Colors"
                          value={invert}
                          min={0}
                          max={100}
                          unit="%"
                          onChange={setInvert}
                        />
                        <Slider
                          label="Soft Focus / Blur"
                          value={blur}
                          min={0}
                          max={10}
                          step={0.5}
                          unit="px"
                          onChange={setBlur}
                        />
                      </div>
                    </div>
                  )}

                  {isFixedConverter(tool.id) && (
                    <div className="space-y-4">
                      <div className="rounded-md border border-border/80 bg-[#fafafa] p-3">
                        <label className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">
                          Output Format
                        </label>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <span className="text-sm font-extrabold text-[#171717]">
                            {formatLabel(FIXED_CONVERTER_FORMAT[tool.id] ?? "png")}
                          </span>
                          <span className="rounded-full border border-[#a3a3a3] bg-[#eeeeee] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#171717]">
                            Fixed target
                          </span>
                        </div>
                      </div>
                      {(FIXED_CONVERTER_FORMAT[tool.id] === "jpeg" || FIXED_CONVERTER_FORMAT[tool.id] === "webp") && (
                        <Slider
                          label="Output Quality"
                          value={quality}
                          min={10}
                          max={100}
                          unit="%"
                          onChange={setQuality}
                        />
                      )}
                      <button
                        onClick={applyProcessing}
                        className="w-full rounded-md bg-[#171717] px-4 py-3 text-xs font-bold text-white shadow-lg shadow-black/10 hover:brightness-110 active:scale-[0.98] transition-all"
                      >
                        Convert to {formatLabel(FIXED_CONVERTER_FORMAT[tool.id] ?? "png")}
                      </button>
                    </div>
                  )}

                  {tool.id === "convert" && (
                    <div className="space-y-4">
                      <label className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">Output Format</label>
                      <div className="flex gap-2">
                        {(["png", "jpeg", "webp"] as const).map((fmt) => (
                          <button
                            key={fmt}
                            onClick={() => setFormat(fmt)}
                            className={`flex-1 rounded-md border py-2 text-xs uppercase font-bold transition-all ${
                              format === fmt
                                ? "border-[#171717] bg-[#e5e5e5] text-[#171717] shadow-sm"
                                : "border-border/80 bg-[#fafafa] text-[#525252] hover:bg-[#ffffff]"
                            }`}
                          >
                            {fmt}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={applyProcessing}
                        className="w-full rounded-md bg-[#171717] px-4 py-3 text-xs font-bold text-white shadow-lg shadow-black/10 hover:brightness-110 active:scale-[0.98] transition-all"
                      >
                        Convert Format
                      </button>
                    </div>
                  )}

                  {/* Collage Maker Controls */}
                  {tool.id === "collage" && (
                    <div className="space-y-4">
                      {/* Grid Layout Selector */}
                      <div>
                        <label className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">
                          Grid Layout
                        </label>
                        <div className="grid grid-cols-3 gap-1.5 mt-1">
                          {COLLAGE_LAYOUTS.map((layout) => (
                            <button
                              key={layout.id}
                              onClick={() => setCollageLayout(layout.id)}
                              className={`rounded-md border py-2 text-[11px] font-bold transition-all ${
                                collageLayout === layout.id
                                  ? "border-[#171717] bg-[#e5e5e5] text-[#171717] shadow-sm"
                                  : "border-border/80 bg-[#fafafa] text-[#525252] hover:bg-[#ffffff] hover:text-[#171717]"
                              }`}
                            >
                              {layout.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Aspect Ratio Selector */}
                      <div>
                        <label className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">
                          Canvas Aspect Ratio
                        </label>
                        <div className="grid grid-cols-4 gap-1.5 mt-1">
                          {["1:1", "4:3", "16:9", "9:16"].map((asp) => (
                            <button
                              key={asp}
                              onClick={() => setCollageAspect(asp)}
                              className={`rounded-md border py-1.5 text-[11px] font-bold transition-all ${
                                collageAspect === asp
                                  ? "border-[#171717] bg-[#e5e5e5] text-[#171717]"
                                  : "border-border/80 bg-[#fafafa] text-[#525252] hover:bg-[#ffffff]"
                              }`}
                            >
                              {asp}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sliders: Spacing & Corner Radius */}
                      <Slider
                        label="Grid Spacing / Gap"
                        value={collageSpacing}
                        min={0}
                        max={40}
                        unit="px"
                        onChange={setCollageSpacing}
                      />
                      <Slider
                        label="Photo Corner Rounding"
                        value={collageRadius}
                        min={0}
                        max={36}
                        unit="px"
                        onChange={setCollageRadius}
                      />

                      {/* Background / Border Color */}
                      <div>
                        <label className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">
                          Border & Background Color
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          {["#171717", "#000000", "#404040", "#737373", "#a3a3a3", "#d4d4d4", "#eeeeee", "#ffffff"].map((c) => (
                            <button
                              key={c}
                              onClick={() => setCollageBgColor(c)}
                              style={{ backgroundColor: c }}
                              className={`h-7 w-7 rounded-lg border transition-all ${
                                collageBgColor === c ? "border-[#171717] ring-2 ring-[#a3a3a3] scale-110" : "border-border"
                              }`}
                            />
                          ))}
                          <input
                            type="color"
                            value={collageBgColor}
                            onChange={(e) => setCollageBgColor(e.target.value)}
                            className="h-7 w-7 cursor-pointer rounded-lg border border-border bg-transparent p-0"
                          />
                        </div>
                      </div>

                      {/* Add More Photos Button & Image Count */}
                      <div className="pt-2 border-t border-[#d4d4d4] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#525252] font-medium">Uploaded Photos:</span>
                          <span className="text-[#171717] font-bold">{collageImages.length} Photos</span>
                        </div>
                        <input
                          ref={collageAddInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => e.target.files && loadCollageFiles(e.target.files)}
                          className="hidden"
                        />
                        <button
                          onClick={() => collageAddInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 rounded-md border border-[#d4d4d4] bg-[#fafafa] py-2.5 text-xs font-bold text-[#171717] hover:bg-[#ffffff] hover:border-[#171717] transition-all"
                        >
                          <Icon name="plus" size={15} />
                          Add More Photos
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-4 border-t border-[#d4d4d4] flex flex-col gap-2.5">
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 rounded-md bg-[#171717] px-4 py-3 text-xs font-extrabold tracking-wide text-white hover:brightness-110 shadow-[0_0_25px_rgba(212,212,212,0.35)] active:scale-[0.98] transition-all"
                  >
                    <Icon name="download" size={15} />
                    Download High-Res Result
                  </button>
                  <button
                    onClick={() => {
                      setImageSrc(null);
                      setOutputSrc(null);
                    }}
                    className="w-full rounded-md border border-[#d4d4d4] bg-[#fafafa] py-2.5 text-xs font-semibold text-[#525252] hover:text-[#171717] hover:border-[#a3a3a3] hover:bg-[#eeeeee] transition-all"
                  >
                    Choose Different Image
                  </button>
                </div>
              </div>
            </BorderGlow>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
