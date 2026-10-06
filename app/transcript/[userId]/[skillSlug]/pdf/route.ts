import { loadPathRecord } from "@/lib/records/load";
import { linesToPdf } from "@/lib/records/pdf";
import { transcriptBlocks } from "@/lib/records/format";
import { auth } from "@/lib/auth";

type RouteProps = { params: Promise<{ userId: string; skillSlug: string }> };

export async function GET(_request: Request, { params }: RouteProps) {
  const session = await auth();
  const { userId, skillSlug } = await params;
  const data = await loadPathRecord(userId, skillSlug, session?.user?.id);
  if (!data) return new Response("Transcript not found.", { status: 404 });
  const bytes = await linesToPdf(transcriptBlocks(data));
  return new Response(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${data.skillSlug}-transcript.pdf"`,
    },
  });
}
