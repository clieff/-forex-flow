import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { getClientsOverview } from "@/lib/clients";
import { clientSchema } from "@/lib/validation";
import { createLog } from "@/lib/logs";

export async function GET() {
  const { user } = await getServerSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clients = await getClientsOverview();
  return NextResponse.json({ clients });
}

export async function POST(request: Request) {
  const { user } = await getServerSession();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = clientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const client = await prisma.client.create({
      data: {
        name: parsed.data.name.trim(),
        contact: parsed.data.contact || null
      }
    });

    await createLog({
      category: "USER",
      action: "CREATE_CLIENT",
      details: `Nouveau client: ${client.name}`,
      userId: user.id
    });

    return NextResponse.json(client);
  } catch (_error) {
    return NextResponse.json({ error: "Client already exists" }, { status: 400 });
  }
}
