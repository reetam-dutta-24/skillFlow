import type { Metadata } from "next";
import { SettingsView } from "./settings-view";

export const metadata: Metadata = {
  title: "Settings",
  description: "Theme, account, and which skills you're actively pursuing.",
  robots: { index: false, follow: false },
};

export default function SettingsPage() {
  return <SettingsView />;
}
