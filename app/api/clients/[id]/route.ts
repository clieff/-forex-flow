import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getClientsOverview } from "@/lib/clients";
import { createLog } from "@/lib/logs";

const updateClientSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  contact: z.string().trim().max(100).optional().or(z.literal(""))
});

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clients = await getClientsOverview();
  const client = clients.find((entry) => entry.id === params.id);

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({ client });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateClientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: { name?: string; contact?: string | null } = {};
  if (parsed.data.name) {
    data.name = parsed.data.name;
  }
  if (parsed.data.contact !== undefined) {
    data.contact = parsed.data.contact || null;
  }

  const client = await prisma.client.update({
    where: { id: params.id },
    data
  });

  await createLog({
    category: "USER",
    action: "UPDATE_CLIENT",
    details: `Client mis a jour: ${client.name}`,
    userId: session.user.id
  });

  return NextResponse.json({ client });
}
