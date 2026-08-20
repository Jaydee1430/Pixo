"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import MobileNav from "@/components/ui/MobileNav";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { CATEGORIES, TOOLS, type ToolCategory, type ToolDef } from "@/lib/tools";
import { ToolModal } from "@/components/hub/ToolModal";

const QUICK_TOOL_IDS = ["bgremove", "resize", "jpg-to-png", "png-to-webp"] as const;

function getToolTone(tool: ToolDef) {
  if (tool.category === "File Converter") {
    return {
      card: "border-[#a3a3a3] bg-[#f5f5f5]",
      icon: "border-[#737373] bg-[#d4d4d4] text-[#171717]",
      tag: "bg-[#e5e5e5] text-[#404040]",
    };
  }

  if (tool.version === 2) {
    return {
      card: "border-[#d4d4d4] bg-[#fafafa]",
      icon: "border-[#a3a3a3] bg-[#e5e5e5] text-[#171717]",
      tag: "bg-[#eeeeee] text-[#404040]",
    };
  }

  return {
    card: "border-[#d4d4d4] bg-[#ffffff]",
    icon: "border-[#a3a3a3] bg-[#e5e5e5] text-[#171717]",
    tag: "bg-[#eeeeee] text-[#404040]",
  };
}

export default function LandingPage() {
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>("All Tools");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTool, setActiveTool] = useState<ToolDef | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("tool-search-input")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const categoryCounts = useMemo(() => {
    return CATEGORIES.reduce<Record<ToolCategory, number>>((acc, category) => {
      acc[category] =
        category === "All Tools"
          ? TOOLS.length
          : category === "Popular"
            ? TOOLS.filter((tool) => tool.isPopular).length
            : TOOLS.filter((tool) => tool.category === category).length;
      return acc;
    }, {} as Record<ToolCategory, number>);
  }, []);

  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      if (selectedCategory === "Popular" && !tool.isPopular) return false;
      if (
        selectedCategory !== "All Tools" &&
        selectedCategory !== "Popular" &&
        tool.category !== selectedCategory
      ) {
        return false;
      }

      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        tool.label.toLowerCase().includes(q) ||
        tool.blurb.toLowerCase().includes(q) ||
        tool.category.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, searchQuery]);

  const quickTools = useMemo(
    () => QUICK_TOOL_IDS.map((id) => TOOLS.find((tool) => tool.id === id)).filter(Boolean) as ToolDef[],
    [],
  );

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#171717] selection:bg-[#e5e5e5] selection:text-[#171717]">
      <MobileNav />

      <main className="mx-auto grid w-full max-w-[1320px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[244px_minmax(0,1fr)] lg:py-7">
        <aside className="hidden self-start rounded-lg border border-[#d4d4d4] bg-[#ffffff] p-3 shadow-[0_12px_30px_rgba(0,0,0,0.06)] lg:sticky lg:top-24 lg:block">
          <div className="mb-4 flex items-center gap-3 border-b border-[#e5e5e5] pb-3">
            <Image
              src="/pixo-logo.png?v=2"
              alt="Pixo logo"
              width={42}
              height={42}
              unoptimized
              className="h-10 w-10 object-contain grayscale"
            />
            <div className="min-w-0">
              <p className="text-sm font-black leading-none text-[#171717]">Pixo</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#737373]">
                Local Image Tools
              </p>
            </div>
          </div>

          <nav aria-label="Tool categories" className="space-y-1">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`flex h-10 w-full items-center justify-between rounded-md px-3 text-left text-sm font-bold transition ${
                  selectedCategory === category
                    ? "bg-[#171717] text-[#ffffff]"
                    : "text-[#525252] hover:bg-[#eeeeee] hover:text-[#171717]"
                }`}
              >
                <span>{category}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] ${
                    selectedCategory === category ? "bg-[#e5e5e5] text-[#171717]" : "bg-[#f5f5f5] text-[#737373]"
                  }`}
                >
                  {categoryCounts[category]}
                </span>
              </button>
            ))}
          </nav>

          <div className="mt-5 rounded-md border border-[#d4d4d4] bg-[#fafafa] p-3">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#525252]">Session</p>
            <div className="mt-3 space-y-2 text-xs font-semibold text-[#525252]">
              <div className="flex items-center gap-2">
                <Icon name="shield" size={14} />
                <span>Browser local</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="download" size={14} />
                <span>Export when ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="lock" size={12} />
                <span>No account needed</span>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <Reveal className="reveal overflow-hidden rounded-lg border border-[#d4d4d4] bg-[#ffffff] shadow-[0_16px_48px_rgba(0,0,0,0.08)]">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="p-5 sm:p-7">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-7 items-center rounded-md border border-[#d4d4d4] bg-[#f5f5f5] px-2.5 text-xs font-black uppercase tracking-[0.1em] text-[#404040]">
                    Private Workspace
                  </span>
                  <span className="inline-flex h-7 items-center rounded-md border border-[#d4d4d4] bg-[#f5f5f5] px-2.5 text-xs font-black text-[#404040]">
                    {TOOLS.length} tools ready
                  </span>
                </div>

                <h1 className="mt-5 max-w-[760px] text-[34px] font-black leading-[1.02] tracking-normal text-[#171717] sm:text-[54px]">
                  Edit images from a tidy local workbench.
                </h1>
                <p className="mt-4 max-w-[680px] text-[15px] leading-7 text-[#525252] sm:text-base">
                  Pick a service, drop a file into its popup, adjust the result, and download the finished image from your browser.
                </p>

                <div className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {quickTools.map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => setActiveTool(tool)}
                      className="flex min-h-[76px] items-center gap-3 rounded-md border border-[#d4d4d4] bg-[#fafafa] p-3 text-left transition hover:-translate-y-0.5 hover:border-[#a3a3a3] hover:bg-[#eeeeee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]"
                    >
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-[#171717] text-[#e5e5e5]">
                        <Icon name={tool.icon} size={18} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-black leading-tight text-[#171717]">{tool.label}</span>
                        <span className="mt-1 block text-xs font-semibold text-[#737373]">Open popup</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#d4d4d4] bg-[#eeeeee] p-5 lg:border-l lg:border-t-0">
                <div className="rounded-lg border border-[#d4d4d4] bg-[#ffffff] p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#525252]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#a3a3a3]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#737373]" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.14em] text-[#737373]">
                      Output Preview
                    </span>
                  </div>

                  <div className="checkerboard flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md border border-[#d4d4d4] bg-[#fafafa]">
                    <div className="relative h-[72%] w-[72%] overflow-hidden rounded-md border border-[#d4d4d4] bg-[#e5e5e5] shadow-[0_16px_34px_rgba(0,0,0,0.15)]">
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-[#d4d4d4]" />
                      <div className="absolute bottom-0 left-0 h-1/2 w-full bg-[#a3a3a3]" />
                      <div className="absolute left-[18%] top-[22%] h-[58%] w-[64%] rounded-full bg-[#f5f5f5]" />
                      <div className="absolute left-[30%] top-[33%] h-[34%] w-[40%] rounded-md bg-[#171717]" />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      ["PNG", "Export"],
                      ["WebP", "Convert"],
                      ["JPG", "Compress"],
                    ].map(([label, text]) => (
                      <div key={label} className="rounded-md border border-[#d4d4d4] bg-[#fafafa] p-2">
                        <p className="text-sm font-black text-[#171717]">{label}</p>
                        <p className="mt-0.5 text-[11px] font-semibold text-[#737373]">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <div id="tools" className="mt-5 rounded-lg border border-[#d4d4d4] bg-[#ffffff] p-3 shadow-[0_12px_34px_rgba(0,0,0,0.06)]">
            <div className="grid gap-3 xl:grid-cols-[1fr_360px]">
              <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`h-10 flex-none rounded-md border px-3 text-sm font-black transition ${
                      selectedCategory === category
                        ? "border-[#171717] bg-[#171717] text-[#ffffff]"
                        : "border-[#d4d4d4] bg-[#fafafa] text-[#525252]"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <label className="relative block">
                <Icon
                  name="search"
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]"
                />
                <input
                  id="tool-search-input"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search image tools"
                  className="h-11 w-full rounded-md border border-[#d4d4d4] bg-[#fafafa] py-2 pl-9 pr-3 text-sm font-semibold text-[#171717] outline-none transition placeholder:text-[#737373] focus:border-[#171717] focus:ring-2 focus:ring-[#d4d4d4]"
                />
              </label>
            </div>
          </div>

          <Reveal className="reveal-stagger mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredTools.map((tool) => {
              const tone = getToolTone(tool);
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setActiveTool(tool)}
                  className={`group flex min-h-[210px] flex-col rounded-lg border p-5 text-left shadow-[0_10px_24px_rgba(24,33,27,0.05)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717] ${tone.card}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-md border ${tone.icon}`}>
                      <Icon name={tool.icon} size={20} />
                    </span>
                    <span className={`rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${tone.tag}`}>
                      {tool.status}
                    </span>
                  </div>

                  <div className="mt-5 flex-1">
                    <h2 className="text-xl font-black leading-tight tracking-normal text-[#171717]">{tool.label}</h2>
                    <p className="mt-2 text-sm leading-6 text-[#525252]">{tool.blurb}</p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-4">
                    <span className="text-xs font-black uppercase tracking-[0.12em] text-[#737373]">{tool.category}</span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-black text-[#171717]">
                      Open
                      <Icon name="chevron-right" size={14} />
                    </span>
                  </div>
                </button>
              );
            })}
          </Reveal>

          {filteredTools.length === 0 && (
            <div className="mt-5 rounded-lg border border-[#d4d4d4] bg-[#ffffff] p-8 text-center">
              <p className="text-sm font-bold text-[#525252]">No tools match your search.</p>
            </div>
          )}
        </section>
      </main>

      <footer id="how" className="mx-auto max-w-[1320px] px-4 pb-8 pt-2 text-xs font-semibold text-[#737373] sm:px-6">
        <div className="rounded-lg border border-[#d4d4d4] bg-[#ffffff] px-4 py-3">
          Pixo runs locally in your browser. Open a tool popup, process your file, and export the result when it looks right.
        </div>
      </footer>

      <ToolModal key={activeTool?.id ?? "closed"} tool={activeTool} onClose={() => setActiveTool(null)} />
    </div>
  );
}
