import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { AccentPicker } from "@/components/forms/AccentPicker.jsx";
import { ThemeToggle } from "@/components/forms/ThemeToggle.jsx";
import { ACCENT_STORAGE_KEY, resolveAccent } from "@/lib/accent";
import { resolveTheme, THEME_STORAGE_KEY } from "@/lib/theme";
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const theme = resolveTheme(cookieStore.get(THEME_STORAGE_KEY)?.value);
  const accent = resolveAccent(cookieStore.get(ACCENT_STORAGE_KEY)?.value);

  return (
    <html
      lang="en"
      data-accent={accent}
      className={`${geistSans.variable} ${geistMono.variable} ${theme} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-3)",
            padding: "var(--space-4) var(--space-4) 0",
          }}
        >
          <AccentPicker defaultAccent={accent} />
          <ThemeToggle defaultTheme={theme} />
        </div>
        {children}
      </body>
    </html>
  );
}
