import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/lib/validation";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: {
      fixedRates: true
    }
  });

  return NextResponse.json({ clients });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
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
        name: parsed.data.name,
        contact: parsed.data.contact || null
      }
    });
    return NextResponse.json(client);
  } catch (error) {
    return NextResponse.json({ error: "Client already exists" }, { status: 400 });
  }
}
