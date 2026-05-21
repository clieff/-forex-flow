import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import { getSuppliersOverview } from "@/lib/suppliers";
import { createLog } from "@/lib/logs";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const suppliers = await getSuppliersOverview();
  return NextResponse.json({ suppliers });
}

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const rl = checkRateLimit({ key: `suppliers:${ip}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { name?: string; contact?: string };
  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const supplier = await prisma.supplier.create({
    data: {
      name,
      contact: body.contact?.trim() || null
    }
  });

  await createLog({
    category: "STOCK",
    action: "CREATE_SUPPLIER",
    details: `Nouveau fournisseur: ${supplier.name}`,
    userId: session.user.id
  });

  return NextResponse.json({ supplier });
}
