import { auth } from "@/lib/auth";
import { certificateBlocks } from "@/lib/records/format";
import { loadPathRecord } from "@/lib/records/load";
import { linesToPdf } from "@/lib/records/pdf";

type RouteProps = { params: Promise<{ userId: string; skillSlug: string }> };

export async function GET(_request: Request, { params }: RouteProps) {
  const session = await auth();
  const { userId, skillSlug } = await params;
  const data = await loadPathRecord(userId, skillSlug, session?.user?.id);
  if (!data?.complete) return new Response("Certificate not found.", { status: 404 });
  const bytes = await linesToPdf(certificateBlocks(data), true);
  return new Response(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${data.skillSlug}-certificate.pdf"`,
    },
  });
}
