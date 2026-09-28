import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PUBLIC_ACCENT, accentBootScript } from "@/lib/accent";
import { DEFAULT_THEME, themeBootScript } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SkillFlow",
    template: "%s · SkillFlow",
  },
  description:
    "A mastery-first learning system with curated roadmaps, grounded quizzes, and a Socratic explain-back gate.",
};

/** Static shell. Request data stays out of this layout so pages can be prerendered. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-accent={PUBLIC_ACCENT}
      className={`${geistSans.variable} ${geistMono.variable} ${DEFAULT_THEME} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <script dangerouslySetInnerHTML={{ __html: accentBootScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
