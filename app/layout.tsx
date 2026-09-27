import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { ThemeToggle } from "@/components/forms/ThemeToggle.jsx";
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

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${theme} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "var(--space-4) var(--space-4) 0",
          }}
        >
          <ThemeToggle defaultTheme={theme} />
        </div>
        {children}
      </body>
    </html>
  );
}
