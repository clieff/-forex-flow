import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { transactionSchema } from "@/lib/validation";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import { getNextReceiptNumber } from "@/lib/receipt-sequence";
import { getAvailableStock } from "@/lib/stock-available";
import { MAX_CUSTOM_RATE_DEVIATION } from "@/lib/constants";
import { createLog } from "@/lib/logs";

class InsufficientStockError extends Error {
  constructor(
    public readonly currencyCode: string,
    public readonly available: string,
    public readonly requested: string
  ) {
    super("Insufficient stock");
  }
}

function insufficientStockResponse(error: InsufficientStockError) {
  return NextResponse.json(
    {
      error: `Stock insuffisant pour ${error.currencyCode} : ${error.available} disponible, ${error.requested} demandé`
    },
    { status: 409 }
  );
}

async function lookupIdempotent(idemKey: string, userId: string) {
  const cached = await prisma.idempotencyKey.findUnique({
    where: { key_userId: { key: idemKey, userId } },
    include: { transaction: { select: { id: true, receiptNumber: true } } }
  });
  return cached?.transaction ?? null;
}

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

  const idemKey = request.headers.get("Idempotency-Key");

  // Court-circuit idempotence : on rejoue la même réponse pour une clé déjà vue.
  if (idemKey) {
    const cached = await lookupIdempotent(idemKey, session.user.id);
    if (cached) {
      return NextResponse.json({ id: cached.id, receiptNumber: cached.receiptNumber });
    }
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

  // Taux par défaut : devise puis éventuel taux fixe négocié pour ce client.
  let defaultRate = parsed.data.type === "BUY" ? currency.buyRate : currency.sellRate;
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
        defaultRate = fixedRate.buyRate;
      } else if (parsed.data.type === "SELL" && fixedRate.sellRate) {
        defaultRate = fixedRate.sellRate;
      }
    }
  }

  let rateUsed = defaultRate;

  // Taux personnalisé : garde-fou anti-fraude (écart max ±5 %) puis priorité absolue.
  if (parsed.data.customRate) {
    const custom = new Prisma.Decimal(parsed.data.customRate);
    const deviation = custom.minus(defaultRate).abs().div(defaultRate);
    if (deviation.gt(MAX_CUSTOM_RATE_DEVIATION)) {
      return NextResponse.json(
        {
          error: `Taux personnalisé hors limites : écart de ${deviation.mul(100).toFixed(2)} % au-delà du maximum autorisé (${MAX_CUSTOM_RATE_DEVIATION * 100} %).`,
          defaultRate: defaultRate.toString(),
          customRate: custom.toString()
        },
        { status: 400 }
      );
    }
    rateUsed = custom.toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
  }

  const amountGiven = new Prisma.Decimal(parsed.data.amountGiven);
  const amountReceived =
    parsed.data.type === "BUY"
      ? amountGiven.mul(rateUsed).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
      : amountGiven.div(rateUsed).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  // Marge réalisée stockée par transaction :
  //   SELL : (taux de vente − coût moyen pondéré) × montant FX vendu
  //   BUY  : 0 (modèle cost-plus assumé : buyRate = PMA, on achète au coût)
  const realizedMarginXaf =
    parsed.data.type === "SELL"
      ? rateUsed
          .minus(currency.buyRate)
          .mul(amountReceived)
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
      : new Prisma.Decimal(0);

  const commissionXaf =
    parsed.data.commissionXaf != null
      ? new Prisma.Decimal(parsed.data.commissionXaf).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
      : new Prisma.Decimal(0);

  const paymentMethod = parsed.data.paymentMethod ?? "CASH";
  const supplierId = parsed.data.supplierId || null;
  const stockAmount = parsed.data.type === "BUY" ? amountGiven : amountReceived;

  // Exécution atomique en isolation Serializable : empêche deux ventes
  // simultanées de passer toutes les deux le contrôle de stock.
  const runOnce = () =>
    prisma.$transaction(
      async (tx) => {
        if (parsed.data.type === "SELL") {
          const available = await getAvailableStock(parsed.data.currencyCode, supplierId, tx);
          if (stockAmount.gt(available)) {
            throw new InsufficientStockError(
              parsed.data.currencyCode,
              available.toString(),
              stockAmount.toString()
            );
          }
        }

        // Numéro de reçu généré dans la même transaction : pas de trou si rollback.
        const receiptNumber = await getNextReceiptNumber(tx);

        const createdTx = await tx.transaction.create({
          data: {
            receiptNumber,
            type: parsed.data.type,
            currencyCode: parsed.data.currencyCode,
            amountGiven,
            amountReceived,
            rateUsed,
            paymentMethod,
            commissionXaf,
            realizedMarginXaf,
            clientName: parsed.data.clientName || null,
            clientId: parsed.data.clientId || null,
            createdById: session.user.id,
            ...(idemKey
              ? { idempotencyKey: { create: { key: idemKey, userId: session.user.id } } }
              : {})
          }
        });

        await tx.stockMovement.create({
          data: {
            currencyCode: parsed.data.currencyCode,
            direction: parsed.data.type === "BUY" ? "IN" : "OUT",
            amount: stockAmount,
            reason: parsed.data.isDebt ? "DEBT_SETTLEMENT" : "TRANSACTION",
            transactionId: createdTx.id,
            supplierId,
            createdById: session.user.id
          }
        });

        if (supplierId && parsed.data.isDebt) {
          const amountFx = parsed.data.type === "BUY" ? amountGiven : amountReceived;
          const debtImpact = parsed.data.type === "BUY" ? amountFx : amountFx.neg();
          await tx.supplierDebt.upsert({
            where: {
              supplierId_currencyCode: {
                supplierId,
                currencyCode: parsed.data.currencyCode
              }
            },
            update: { amount: { increment: debtImpact } },
            create: {
              supplierId,
              currencyCode: parsed.data.currencyCode,
              amount: debtImpact
            }
          });
        }

        return createdTx;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

  let transaction: Awaited<ReturnType<typeof runOnce>>;
  try {
    transaction = await runOnce();
  } catch (e) {
    if (e instanceof InsufficientStockError) {
      return insufficientStockResponse(e);
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      // Collision sur Idempotency-Key : un retry parallèle a déjà créé la transaction.
      if (e.code === "P2002" && idemKey) {
        const cached = await lookupIdempotent(idemKey, session.user.id);
        if (cached) {
          return NextResponse.json({ id: cached.id, receiptNumber: cached.receiptNumber });
        }
      }
      // Échec de sérialisation : on retente une fois.
      if (e.code === "P2034") {
        try {
          transaction = await runOnce();
        } catch (retry) {
          if (retry instanceof InsufficientStockError) {
            return insufficientStockResponse(retry);
          }
          if (
            retry instanceof Prisma.PrismaClientKnownRequestError &&
            retry.code === "P2002" &&
            idemKey
          ) {
            const cached = await lookupIdempotent(idemKey, session.user.id);
            if (cached) {
              return NextResponse.json({ id: cached.id, receiptNumber: cached.receiptNumber });
            }
          }
          throw retry;
        }
      } else {
        throw e;
      }
    } else {
      throw e;
    }
  }

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/transactions/new");

  await createLog({
    category: "TRANSACTION",
    action: `CREATE_${transaction.type}`,
    details: `${transaction.amountGiven} ${transaction.currencyCode} -> ${transaction.amountReceived} XAF (Réf: ${transaction.receiptNumber})`,
    userId: session.user.id
  });

  return NextResponse.json({ id: transaction.id, receiptNumber: transaction.receiptNumber });
}
