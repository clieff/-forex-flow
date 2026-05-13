import bcrypt from "bcryptjs";
import { PrismaClient, Prisma, Role, Type } from "@prisma/client";
import { subDays, subHours } from "date-fns";

const prisma = new PrismaClient();

const currencies = [
  { code: "USD", name: "United States Dollar", flagCode: "us", buyRate: new Prisma.Decimal(600), sellRate: new Prisma.Decimal(615) },
  { code: "EUR", name: "Euro", flagCode: "eu", buyRate: new Prisma.Decimal(655), sellRate: new Prisma.Decimal(670) }
];

async function main() {
  await prisma.transaction.deleteMany();
  await prisma.rateHistory.deleteMany();
  await prisma.currency.deleteMany();
  await prisma.user.deleteMany();

  const [adminPassword, agentPassword] = await Promise.all([
    bcrypt.hash("admin123", 10),
    bcrypt.hash("agent123", 10)
  ]);

  const admin = await prisma.user.create({
    data: {
      name: "Amina Njoya",
      email: "admin@forexflow.pro",
      passwordHash: adminPassword,
      role: Role.ADMIN
    }
  });

  const agent = await prisma.user.create({
    data: {
      name: "Kevin Mbianda",
      email: "agent@forexflow.pro",
      passwordHash: agentPassword,
      role: Role.AGENT
    }
  });

  await prisma.currency.createMany({
    data: currencies
  });

  await prisma.rateHistory.createMany({
    data: [
      {
        currencyCode: "USD",
        oldBuyRate: new Prisma.Decimal(597),
        newBuyRate: new Prisma.Decimal(600),
        oldSellRate: new Prisma.Decimal(612),
        newSellRate: new Prisma.Decimal(615),
        changedById: admin.id,
        changedAt: subHours(new Date(), 16)
      },
      {
        currencyCode: "EUR",
        oldBuyRate: new Prisma.Decimal(650),
        newBuyRate: new Prisma.Decimal(655),
        oldSellRate: new Prisma.Decimal(666),
        newSellRate: new Prisma.Decimal(670),
        changedById: admin.id,
        changedAt: subHours(new Date(), 12)
      }
    ]
  });

  const records = Array.from({ length: 50 }).map((_, index) => {
    const currency = currencies[index % currencies.length];
    const type = (index + 3) % 4 === 0 ? Type.SELL : Type.BUY;
    const amountGiven = new Prisma.Decimal(
      type === Type.BUY
        ? Number((80 + ((index * 37) % 720) + (index % 5) * 0.25).toFixed(2))
        : Number((40000 + ((index * 12850) % 280000)).toFixed(2))
    );
    const rateUsed = type === Type.BUY ? currency.buyRate : currency.sellRate;
    const amountReceived =
      type === Type.BUY
        ? amountGiven.mul(rateUsed).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
        : amountGiven.div(rateUsed).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    return {
      type,
      currencyCode: currency.code,
      amountGiven,
      amountReceived,
      rateUsed,
      clientName: `Client ${index + 1}`,
      createdById: index % 3 === 0 ? admin.id : agent.id,
      createdAt: subDays(new Date(), index % 30)
    };
  });

  await prisma.transaction.createMany({
    data: records
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
