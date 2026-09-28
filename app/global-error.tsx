"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { PUBLIC_ACCENT, accentBootScript } from "@/lib/accent";
import { DEFAULT_THEME, themeBootScript } from "@/lib/theme";
import { RecoverableError } from "@/components/feedback/RecoverableError";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html
      lang="en"
      data-accent={PUBLIC_ACCENT}
      className={`${geistSans.variable} ${geistMono.variable} ${DEFAULT_THEME} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <title>Something went wrong · SkillFlow</title>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <script dangerouslySetInnerHTML={{ __html: accentBootScript }} />
      </head>
      <body className="min-h-full">
        <RecoverableError error={error} retry={retry} />
      </body>
    </html>
  );
}
