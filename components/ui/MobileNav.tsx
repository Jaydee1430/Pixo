"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const menu = open ? (
    <div className="fixed inset-0 z-50 sm:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={() => setOpen(false)}
        aria-label="Close menu"
      />

      <div className="absolute inset-y-0 right-0 flex w-[min(320px,88vw)] flex-col border-l border-border bg-canvas shadow-[-8px_0_32px_rgba(0,0,0,0.5)]">
        <div className="flex h-14 flex-none items-center justify-between border-b border-border px-4">
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <Image
              src="/pixo-logo.png"
              alt="Pixo logo"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
            <span className="text-[16px] font-bold tracking-tight text-text">Pixo</span>
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-textlabel transition hover:bg-surface2 hover:text-textbright"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          <a
            href="#features"
            className="rounded-lg px-3 py-3 text-[15px] font-medium text-textlabel transition hover:bg-surface2 hover:text-textbright"
            onClick={() => setOpen(false)}
          >
            Features
          </a>
          <a
            href="#how"
            className="rounded-lg px-3 py-3 text-[15px] font-medium text-textlabel transition hover:bg-surface2 hover:text-textbright"
            onClick={() => setOpen(false)}
          >
            How it works
          </a>
        </nav>

        <div className="flex-none border-t border-border p-4">
          <Link
            href="/editor"
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-accent text-[15px] font-semibold text-canvas transition hover:brightness-110"
            onClick={() => setOpen(false)}
          >
            Open editor
          </Link>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <header className="sticky top-0 z-30 border-b border-[#1c2026] bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:h-16 sm:gap-8 sm:px-6">
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

        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <Link
            href="/editor"
            className="hidden sm:inline-flex h-[34px] items-center rounded-md bg-accent px-4 text-[13px] font-semibold text-canvas transition hover:brightness-110"
          >
            Open editor
          </Link>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface sm:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
          >
            <Icon name="menu" size={18} />
          </button>
        </div>
      </div>

      {mounted && menu ? createPortal(menu, document.body) : null}
    </header>
  );
}
