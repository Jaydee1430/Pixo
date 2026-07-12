import Link from "next/link";
import Image from "next/image";
import { TOOLS } from "@/lib/tools";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-canvas text-textbright">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-[#1c2026] bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/pixo-logo.png"
              alt="Pixo logo"
              width={30}
              height={30}
              priority
              className="h-[30px] w-[30px] object-contain"
            />
            <span className="text-[17px] font-bold tracking-tight text-text">Pixo</span>
          </Link>
          <nav className="hidden flex-1 items-center justify-center gap-7 sm:flex">
            <a href="#features" className="text-[13px] font-medium text-textlabel transition hover:text-text">
              Features
            </a>
            <a href="#how" className="text-[13px] font-medium text-textlabel transition hover:text-text">
              How it works
            </a>
          </nav>
          <div className="flex flex-1 justify-end sm:flex-none">
            <Link
              href="/editor"
              className="inline-flex h-[34px] items-center rounded-md bg-accent px-4 text-[13px] font-semibold text-canvas transition hover:brightness-110"
            >
              Open editor
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* animated aurora + dot grid */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[620px] overflow-hidden">
          <div className="dot-grid absolute inset-0" />
          <span className="aurora-blob aurora-a" />
          <span className="aurora-blob aurora-b" />
          <span className="aurora-blob aurora-c" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-20 text-center sm:pb-28 sm:pt-24">
          <span
            className="animate-fadeup flex items-center gap-2 rounded-full border border-accent/25 bg-accent/[0.08] px-3.5 py-1.5 text-xs font-medium text-accent backdrop-blur"
            style={{ animationDelay: "0ms" }}
          >
            <span className="animate-pixopulse h-1.5 w-1.5 rounded-full bg-accent" />
            Now in your browser — nothing to install
          </span>
          <h1
            className="animate-fadeup mt-6 max-w-[820px] text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-[60px]"
            style={{ animationDelay: "70ms" }}
          >
            <span className="text-gradient">Professional image editing,</span>
            <br className="hidden sm:block" />
            <span className="text-gradient"> right in your browser</span>
          </h1>
          <p
            className="animate-fadeup mt-5 max-w-[620px] text-pretty text-[15px] leading-relaxed text-text2 sm:text-[17px]"
            style={{ animationDelay: "140ms" }}
          >
            Remove backgrounds, retouch, crop, and export in seconds. Pixo runs entirely in your
            browser — your images never leave your machine.
          </p>
          <div
            className="animate-fadeup mt-8 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "210ms" }}
          >
            <Link
              href="/editor"
              className="glow-accent inline-flex h-11 items-center rounded-lg bg-accent px-6 text-[15px] font-semibold text-canvas transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Start editing — it&apos;s free
            </Link>
            <a
              href="#how"
              className="inline-flex h-11 items-center rounded-lg border border-border bg-surface/80 px-6 text-[15px] font-medium text-textbright backdrop-blur transition hover:-translate-y-0.5 hover:border-border2 hover:bg-surface2"
            >
              See how it works
            </a>
          </div>
          <span
            className="animate-fadeup mt-4 text-xs text-textmuted"
            style={{ animationDelay: "280ms" }}
          >
            No account needed · JPG, PNG, WebP
          </span>

          {/* Editor preview mock */}
          <div
            className="animate-fadeup relative mt-14 w-full max-w-[1060px]"
            style={{ animationDelay: "360ms" }}
          >
            <div
              className="anim-floaty pointer-events-none absolute -inset-x-10 -top-8 bottom-0 rounded-[40px] opacity-50 blur-3xl"
              style={{ background: "radial-gradient(closest-side, rgba(76,141,255,0.28), transparent)" }}
            />
            <div className="relative w-full overflow-hidden rounded-xl border border-border shadow-[0_-1px_0_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.6)]">
          {/* window top bar */}
          <div className="flex h-9 items-center gap-2.5 border-b border-border bg-surface px-3.5">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
            </div>
            <span className="text-xs font-medium text-text2">summer-shoot-04.jpg — Pixo</span>
            <div className="ml-auto hidden items-center gap-1.5 sm:flex">
              <span className="h-4 w-7 rounded bg-surface2" />
              <span className="h-4 w-10 rounded bg-surface2" />
              <span className="h-4 w-12 rounded-md bg-accent/80" />
            </div>
          </div>

          {/* body */}
          <div className="flex h-[280px] bg-canvas sm:h-[380px]">
            {/* tool rail */}
            <div className="flex w-12 flex-none flex-col items-center gap-1 border-r border-border bg-surface py-3">
              {(
                [
                  ["select", false],
                  ["crop", false],
                  ["resize", false],
                  ["bgremove", false],
                  ["adjust", true],
                  ["filters", false],
                ] as const
              ).map(([icon, active], i) => (
                <span
                  key={i}
                  className={
                    "flex h-7 w-7 items-center justify-center rounded-md " +
                    (active ? "border border-accent bg-accent/15 text-accent" : "text-text2")
                  }
                >
                  <Icon name={icon} size={15} />
                </span>
              ))}
            </div>

            {/* canvas */}
            <div className="relative flex flex-1 items-center justify-center">
              <div
                className="checkerboard absolute inset-0 opacity-40"
                style={{ backgroundSize: "16px 16px" }}
              />
              <div className="relative h-[62%] w-[66%]">
                <div
                  className="h-full w-full rounded-[2px] shadow-[0_10px_30px_rgba(0,0,0,0.55)]"
                  style={{
                    background:
                      "radial-gradient(ellipse 90% 60% at 70% 20%, rgba(255,214,150,0.6), transparent 60%), radial-gradient(ellipse 70% 50% at 25% 85%, rgba(30,60,45,0.9), transparent 65%), linear-gradient(180deg, #cf9a5e 0%, #a8714d 30%, #5d5a52 55%, #2e3a38 78%, #1c2624 100%)",
                  }}
                />
                <div className="pointer-events-none absolute -inset-px border-[1.5px] border-accent" />
                {[
                  "left-0 top-0",
                  "left-1/2 top-0 -translate-x-1/2",
                  "right-0 top-0",
                  "left-0 top-1/2 -translate-y-1/2",
                  "right-0 top-1/2 -translate-y-1/2",
                  "left-0 bottom-0",
                  "left-1/2 bottom-0 -translate-x-1/2",
                  "right-0 bottom-0",
                ].map((pos, i) => (
                  <span
                    key={i}
                    className={"absolute h-1.5 w-1.5 rounded-[1px] border border-accent bg-white " + pos}
                    style={{ margin: "-3px" }}
                  />
                ))}
              </div>
            </div>

            {/* right panel */}
            <div className="hidden w-[210px] flex-none flex-col gap-3 border-l border-border bg-surface p-3.5 sm:flex">
              <div className="flex items-center gap-2 border-b border-border pb-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded border border-accent/25 bg-accent/10 text-accent">
                  <Icon name="adjust" size={11} />
                </span>
                <span className="text-[11px] font-semibold text-text">Adjustments</span>
              </div>
              {(
                [
                  ["Brightness", 62, "+6"],
                  ["Contrast", 74, "+12"],
                  ["Saturation", 40, "−4"],
                  ["Temperature", 68, "+8"],
                ] as const
              ).map(([label, pct, val]) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-textlabel">{label}</span>
                    <span className="rounded border border-border bg-surface2 px-1 py-px text-[9px] text-text2 tabular-nums">
                      {val}
                    </span>
                  </div>
                  <div
                    className="relative h-1 rounded-full"
                    style={{
                      background: `linear-gradient(to right, var(--accent) ${pct}%, #2a2f37 ${pct}%)`,
                    }}
                  >
                    <span
                      className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-black/40 bg-white shadow"
                      style={{ left: `${pct}%`, marginLeft: -5 }}
                    />
                  </div>
                </div>
              ))}
              <div className="mt-auto flex flex-col gap-2">
                <span className="flex h-7 items-center justify-center gap-1.5 rounded-md border border-border bg-surface2 text-[10px] font-medium text-textbright">
                  <Icon name="sparkle" size={11} />
                  Auto-enhance
                </span>
                <span className="flex h-8 items-center justify-center gap-1.5 rounded-md bg-accent text-[11px] font-semibold text-canvas">
                  <Icon name="download" size={12} />
                  Export
                </span>
              </div>
            </div>
          </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tools grid ──────────────────────────────────────── */}
      <section id="features" className="border-t border-[#1c2026]">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-[72px]">
          <Reveal className="reveal max-w-[560px]">
            <h2 className="text-[26px] font-bold leading-tight tracking-tight text-text sm:text-[32px]">
              Every tool you reach for daily
            </h2>
            <p className="mt-2.5 text-[15px] leading-relaxed text-text2">
              Fast, non-destructive, and full resolution — always free, no account needed.
            </p>
          </Reveal>
          <Reveal className="reveal-stagger mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.filter((t) => t.id !== "select").map((tool) => (
              <div
                key={tool.id}
                className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-6 transition duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
              >
                <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[9px] border border-accent/20 bg-accent/10 text-accent transition group-hover:shadow-[0_0_20px_rgba(76,141,255,0.35)]">
                  <Icon name={tool.icon} size={18} />
                </span>
                <span className="text-[15px] font-semibold text-text">{tool.label}</span>
                <span className="text-[13px] leading-relaxed text-text2">{tool.blurb}</span>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section id="how" className="border-t border-[#1c2026]">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-[72px]">
          <Reveal className="reveal">
            <h2 className="text-[26px] font-bold leading-tight tracking-tight text-text sm:text-[32px]">
              Private by design
            </h2>
          </Reveal>
          <Reveal className="reveal-stagger mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                icon: "import" as const,
                title: "1 · Open an image",
                desc: "Drag & drop or browse. Nothing uploads — the file opens directly in your browser.",
              },
              {
                icon: "sparkle" as const,
                title: "2 · Edit instantly",
                desc: "Background removal and every other tool run locally in your browser — no uploads, no waiting. Your photo never leaves your machine.",
              },
              {
                icon: "download" as const,
                title: "3 · Export",
                desc: "Download as PNG, JPG, or WebP at any quality — exactly what you saw on the canvas.",
              },
            ].map((step) => (
              <div
                key={step.title}
                className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-6 transition duration-200 hover:-translate-y-1 hover:border-accent/40"
              >
                <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[9px] border border-accent/20 bg-accent/10 text-accent">
                  <Icon name={step.icon} size={16} />
                </span>
                <span className="text-[15px] font-semibold text-text">{step.title}</span>
                <span className="text-[13px] leading-relaxed text-text2">{step.desc}</span>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── CTA footer ──────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-[#1c2026]">
        <div
          className="anim-ctaglow pointer-events-none absolute left-1/2 bottom-[-220px] h-[420px] w-[760px] -translate-x-1/2 rounded-full opacity-50 blur-[110px]"
          style={{ background: "radial-gradient(closest-side, rgba(76,141,255,0.32), transparent)" }}
        />
        <Reveal className="reveal relative mx-auto flex max-w-6xl flex-col items-center px-6 pb-14 pt-16 text-center sm:pt-[72px]">
          <h2 className="text-gradient text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">
            Open an image. Ship it in minutes.
          </h2>
          <Link
            href="/editor"
            className="glow-accent mt-6 inline-flex h-11 items-center rounded-lg bg-accent px-[26px] text-[15px] font-semibold text-canvas transition hover:-translate-y-0.5 hover:brightness-110"
          >
            Start editing free
          </Link>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-6 text-xs text-textmuted">
            <span>Free &amp; private — runs entirely in your browser</span>
            <span>© 2026 Pixo</span>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
