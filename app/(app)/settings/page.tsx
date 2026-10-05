import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSettingsProfile } from "@/lib/data/settings";
import { SettingsScreen } from "./_components/SettingsScreen";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const profile = await getSettingsProfile();

  return (
    <div className="sf-settings-page">
      <header className="sf-page-head">
        <h1>Settings</h1>
        <p>Profile, city, skills, reminders, and how the app looks.</p>
      </header>
      <SettingsScreen {...profile} showPreview={process.env.NODE_ENV === "development"} />
    </div>
  );
}
