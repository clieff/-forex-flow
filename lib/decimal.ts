import { Prisma } from "@prisma/client";

export type DecimalLike = Prisma.Decimal | number;

export function toDecimal(value: DecimalLike) {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
}

export function toNumber(value: DecimalLike) {
  return value instanceof Prisma.Decimal ? value.toNumber() : value;
}

