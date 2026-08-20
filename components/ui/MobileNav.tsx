"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";

export default function MobileNav() {
  const [open, setOpen] = useState(false);

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
        className="absolute inset-0 bg-[#171717]/35 backdrop-blur-[2px]"
        onClick={() => setOpen(false)}
        aria-label="Close menu"
      />

      <div className="absolute inset-y-0 right-0 flex w-[min(320px,88vw)] flex-col border-l border-[#d4d4d4] bg-[#ffffff] shadow-[-8px_0_32px_rgba(0,0,0,0.18)]">
        <div className="flex h-14 flex-none items-center justify-between border-b border-[#d4d4d4] px-4">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <Image
              src="/pixo-logo.png?v=2"
              alt="Pixo logo"
              width={34}
              height={34}
              unoptimized
              className="h-8 w-8 object-contain grayscale"
            />
            <Image
              src="/pixo-text.png?v=2"
              alt="Pixo"
              width={85}
              height={28}
              unoptimized
              className="h-6 w-auto object-contain grayscale"
            />
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#d4d4d4] bg-[#fafafa] text-[#525252] transition hover:bg-[#eeeeee] hover:text-[#171717]"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          <a
            href="#tools"
            className="rounded-md px-3 py-3 text-[15px] font-bold text-[#525252] transition hover:bg-[#eeeeee] hover:text-[#171717]"
            onClick={() => setOpen(false)}
          >
            Tools
          </a>
          <a
            href="#how"
            className="rounded-md px-3 py-3 text-[15px] font-bold text-[#525252] transition hover:bg-[#eeeeee] hover:text-[#171717]"
            onClick={() => setOpen(false)}
          >
            How it works
          </a>
        </nav>

        <div className="flex-none border-t border-[#d4d4d4] p-4">
          <a
            href="#tools"
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[#171717] text-[15px] font-black text-[#ffffff] transition hover:bg-[#262626]"
            onClick={() => setOpen(false)}
          >
            Explore Tools
          </a>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <header className="sticky top-0 z-30 border-b border-[#d4d4d4] bg-[#ffffff]/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-4 px-4 sm:h-16 sm:gap-8 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/pixo-logo.png?v=2"
            alt="Pixo logo"
            width={38}
            height={38}
            priority
            unoptimized
            className="h-[38px] w-[38px] object-contain grayscale"
          />
          <Image
            src="/pixo-text.png?v=2"
            alt="Pixo"
            width={96}
            height={32}
            priority
            unoptimized
            className="h-[28px] w-auto object-contain grayscale"
          />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-7 sm:flex">
          <a href="#tools" className="text-[13px] font-black text-[#525252] transition hover:text-[#171717]">
            Tools
          </a>
          <a href="#how" className="text-[13px] font-black text-[#525252] transition hover:text-[#171717]">
            How it works
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <a
            href="#tools"
            className="hidden h-[34px] items-center rounded-md bg-[#171717] px-4 text-[13px] font-black text-[#ffffff] transition hover:bg-[#262626] sm:inline-flex"
          >
            Explore Tools
          </a>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#d4d4d4] bg-[#fafafa] text-[#171717] sm:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
          >
            <Icon name="menu" size={18} />
          </button>
        </div>
      </div>

      {menu}
    </header>
  );
}
