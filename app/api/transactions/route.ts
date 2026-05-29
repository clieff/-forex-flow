import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { transactionSchema } from "@/lib/validation";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import { getNextReceiptNumber } from "@/lib/receipt-sequence";
import { Prisma } from "@prisma/client";
import { createLog } from "@/lib/logs";

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const rl = await checkRateLimit({ key: `tx:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = transactionSchema.safeParse({
    ...body,
    amountGiven: Number(body.amountGiven)
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const currency = await prisma.currency.findUnique({
    where: { code: parsed.data.currencyCode }
  });

  if (!currency) {
    return NextResponse.json({ error: "Currency not found" }, { status: 404 });
  }

  let rateUsed = parsed.data.type === "BUY" ? currency.buyRate : currency.sellRate;

  // Check for fixed client rates
  if (parsed.data.clientId) {
    const fixedRate = await prisma.clientRate.findUnique({
      where: {
        clientId_currencyCode: {
          clientId: parsed.data.clientId,
          currencyCode: parsed.data.currencyCode
        }
      }
    });

    if (fixedRate) {
      if (parsed.data.type === "BUY" && fixedRate.buyRate) {
        rateUsed = fixedRate.buyRate;
      } else if (parsed.data.type === "SELL" && fixedRate.sellRate) {
        rateUsed = fixedRate.sellRate;
      }
    }
  }

  // Taux manuel saisi par l'agent : prioritaire, pour que le taux enregistré
  // corresponde exactement à l'aperçu affiché dans le formulaire.
  if (parsed.data.customRate) {
    rateUsed = new Prisma.Decimal(parsed.data.customRate).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
  }

  const amountGiven = new Prisma.Decimal(parsed.data.amountGiven);
  const amountReceived =
    parsed.data.type === "BUY"
      ? amountGiven.mul(rateUsed).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
      : amountGiven.div(rateUsed).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  // Générer le numéro de reçu séquentiel
  const receiptNumber = await getNextReceiptNumber();

  const transaction = await prisma.$transaction(async (tx) => {
    const createdTx = await tx.transaction.create({
      data: {
        receiptNumber,
        type: parsed.data.type,
        currencyCode: parsed.data.currencyCode,
        amountGiven,
        amountReceived,
        rateUsed,
        clientName: parsed.data.clientName || null,
        clientId: parsed.data.clientId || null,
        createdById: session.user.id
      }
    });

    // Stock movement (foreign currency stock only)
    await tx.stockMovement.create({
      data: {
        currencyCode: parsed.data.currencyCode,
        direction: parsed.data.type === "BUY" ? "IN" : "OUT",
        amount: parsed.data.type === "BUY" ? amountGiven : amountReceived,
        reason: parsed.data.isDebt ? "DEBT_SETTLEMENT" : "TRANSACTION",
        transactionId: createdTx.id,
        supplierId: parsed.data.supplierId || null,
        createdById: session.user.id
      }
    });

    if (parsed.data.supplierId && parsed.data.isDebt) {
      // Si c'est un recouvrement de dette lors d'une transaction
      // BUY (IN) = On reçoit FX, si c'est une dette, ça réduit ce que le fournisseur nous doit.
      // SELL (OUT) = On donne FX au client pour le compte du fournisseur, si c'est une dette, ça augmente ce qu'il nous doit.
      // Ici le user dit "reccouvrir la dete" -> donc on reçoit du FX pour éponger une créance.
      const amountFx = parsed.data.type === "BUY" ? amountGiven : amountReceived;
      const debtImpact = parsed.data.type === "BUY" ? amountFx : amountFx.neg();

      await tx.supplierDebt.upsert({
        where: {
          supplierId_currencyCode: {
            supplierId: parsed.data.supplierId,
            currencyCode: parsed.data.currencyCode
          }
        },
        update: {
          amount: { increment: debtImpact }
        },
        create: {
          supplierId: parsed.data.supplierId,
          currencyCode: parsed.data.currencyCode,
          amount: debtImpact
        }
      });
    }

    return createdTx;
  });

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/transactions/new");

  await createLog({
    category: "TRANSACTION",
    action: `CREATE_${transaction.type}`,
    details: `${transaction.amountGiven} ${transaction.currencyCode} -> ${transaction.amountReceived} XAF (Réf: ${transaction.receiptNumber})`,
    userId: session.user.id
  });

  return NextResponse.json({ id: transaction.id, receiptNumber });
}
