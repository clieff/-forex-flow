import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { renderToStream } from "@react-pdf/renderer";
import { DailyReportDocument } from "@/components/pdf/daily-report-document";

export async function GET(request: Request) {
  const { user } = await getServerSession();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");
  
  // Appel de notre propre API JSON pour récupérer les données consolidées
  const apiUrl = new URL("/api/rapports/journalier", request.url);
  if (dateStr) apiUrl.searchParams.set("date", dateStr);
  
  // Pour éviter des problèmes d'URL relative en SSR côté Next.js, on passe le cookie
  const cookie = request.headers.get("cookie") || "";
  
  const res = await fetch(apiUrl.toString(), {
    headers: { cookie }
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch report data" }, { status: 500 });
  }

  const data = await res.json();

  const stream = await renderToStream(<DailyReportDocument data={data} />);

  const formattedDate = new Date(data.date).toISOString().split("T")[0];
  const filename = `cloture_journaliere_${formattedDate}.pdf`;

  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
