import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { createLog } from "@/lib/logs";
import { currencySchema } from "@/lib/validation";

export async function POST(request: Request) {
  const { user } = await getServerSession();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = currencySchema.safeParse({
      ...body,
      buyRate: Number(body.buyRate),
      sellRate: Number(body.sellRate)
    });

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { code, name, flagCode, buyRate, sellRate } = parsed.data;

    const existing = await prisma.currency.findUnique({
      where: { code }
    });

    if (existing) {
      return NextResponse.json({ error: "Cette devise existe deja." }, { status: 400 });
    }

    const currency = await prisma.currency.create({
      data: {
        code,
        name,
        flagCode,
        buyRate,
        sellRate
      }
    });

    await createLog({
      category: "RATE",
      action: "CREATE_CURRENCY",
      details: `Nouvelle devise ajoutee: ${currency.code} (${currency.name})`,
      userId: user.id
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

export async function DELETE(request: Request) {
  const { user } = await getServerSession();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Code de devise requis" }, { status: 400 });
    }

    const currency = await prisma.currency.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        _count: {
          select: {
            transactions: true,
            stockMoves: true,
            clientRates: true,
            supplierDebts: true,
            clientDebts: true
          }
        }
      }
    });

    if (!currency) {
      return NextResponse.json({ error: "Devise non trouvee" }, { status: 404 });
    }

    const total = currency._count.transactions + currency._count.stockMoves;
    if (total > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer: ${currency.code} est liee a ${total} transaction(s) ou mouvement(s) de stock.` },
        { status: 409 }
      );
    }

    await prisma.currency.delete({
      where: { code: currency.code }
    });

    await createLog({
      category: "RATE",
      action: "DELETE_CURRENCY",
      details: `Devise supprimee: ${currency.code} (${currency.name})`,
      userId: user.id
    });

    return NextResponse.json({ success: true, deleted: currency.code });
  } catch (error) {
    console.error("Error deleting currency:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
