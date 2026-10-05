import { redirect } from "next/navigation";

export default async function MapRedirect({ searchParams }: { searchParams: Promise<{ niche?: string }> }) {
  const { niche } = await searchParams;
  redirect(niche ? `/nearby?niche=${encodeURIComponent(niche)}` : "/nearby");
}
