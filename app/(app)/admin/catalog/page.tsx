import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/require-admin";
import { getCatalogEditor, listCatalogSkills } from "@/lib/data/catalog-admin";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { AdminSectionNav } from "../_components/AdminSectionNav";
import { CatalogEditor } from "./_components/CatalogEditor";
import { NicheForm } from "./_components/NicheForm";

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { title: "Page not found" };
  return { title: "Catalog" };
}

export default async function AdminCatalogPage() {
  await requireAdmin();
  const [catalog, skills] = await Promise.all([getCatalogEditor(), listCatalogSkills()]);

  return (
    <div className="sf-admin-page">
      <header className="sf-page-head">
        <AdminSectionNav current="catalog" />
        <h1>Catalog</h1>
        <p>Add a niche, or add a resource to a stage that already exists.</p>
      </header>
      <NicheForm skills={skills} />
      {catalog.length === 0 ? (
        <EmptyState icon="library" title="No stages yet" description="A skill needs stages before a resource can be added." />
      ) : (
        <CatalogEditor skills={catalog} />
      )}
    </div>
  );
}
