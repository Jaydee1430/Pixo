import type { Metadata, Viewport } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pixo — Professional image editing in your browser",
  description:
    "Remove backgrounds, retouch, crop, and export in seconds. Pixo runs entirely in your browser — your images never leave your machine.",
  icons: {
    icon: "/pixo-logo.png",
    shortcut: "/pixo-logo.png",
    apple: "/pixo-logo.png",
  },
  appleWebApp: {
    capable: true,
    title: "Pixo",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={cn("h-full", inter.variable, "font-sans", geist.variable)}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-bg text-textbright min-h-full">{children}</body>
    </html>
  );
}
