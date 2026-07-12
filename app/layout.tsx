import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pixo — Professional image editing in your browser",
  description:
    "Remove backgrounds, retouch, crop, and export in seconds. Pixo runs entirely in your browser — your images never leave your machine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} h-full`}>
      <body className="bg-bg text-textbright min-h-full">{children}</body>
    </html>
  );
}
