import type { Metadata } from "next";
import { requireAdmin } from "@/lib/require-admin";
import { getCatalogEditor, listCatalogSkills } from "@/lib/data/catalog-admin";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { AdminSectionNav } from "../_components/AdminSectionNav";
import { CatalogEditor } from "./_components/CatalogEditor";
import { NicheForm } from "./_components/NicheForm";

export const metadata: Metadata = { title: "Catalog" };

export default async function AdminCatalogPage() {
  await requireAdmin();
  const [catalog, skills] = await Promise.all([getCatalogEditor(), listCatalogSkills()]);

  return (
    <div className="sf-admin-page">
      <header className="sf-page-head">
        <AdminSectionNav current="catalog" />
        <h1>Catalog</h1>
        <p>Add a niche, mark a skill available or coming soon, and edit the stages and resources already on it.</p>
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
