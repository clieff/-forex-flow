import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createLog } from "@/lib/logs";

const currencySchema = z.object({
  code: z.string().min(2).max(5).transform(v => v.toUpperCase()),
  name: z.string().min(2),
  flagCode: z.string().min(2),
  buyRate: z.number().positive(),
  sellRate: z.number().positive(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = currencySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { code, name, flagCode, buyRate, sellRate } = parsed.data;

    // Vérifier si la devise existe déjà
    const existing = await prisma.currency.findUnique({
      where: { code }
    });

    if (existing) {
      return NextResponse.json({ error: "Cette devise existe déjà." }, { status: 400 });
    }

    const currency = await prisma.currency.create({
      data: {
        code,
        name,
        flagCode,
        buyRate,
        sellRate,
      }
    });

    await createLog({
      category: "RATE",
      action: "CREATE_CURRENCY",
      details: `Nouvelle devise ajoutée: ${currency.code} (${currency.name})`,
      userId: session.user.id
    });

    return NextResponse.json(currency);
  } catch (error) {
    console.error("Error creating currency:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

export async function GET() {
  const currencies = await prisma.currency.findMany({
    orderBy: { code: "asc" }
  });
  return NextResponse.json(currencies);
}
