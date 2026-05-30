import { z } from "zod";
import { decimalPlaces } from "@/lib/utils";

export const transactionSchema = z.object({
  type: z.enum(["BUY", "SELL"]),
  currencyCode: z.string().min(3).max(3),
  amountGiven: z
    .number({ invalid_type_error: "Montant invalide" })
    .positive("Le montant doit être supérieur à 0")
    .refine((value) => decimalPlaces(value) <= 2, "Maximum 2 décimales"),
  clientName: z.string().trim().max(120).optional().or(z.literal("")),
  clientId: z.string().optional(),
  supplierId: z.string().optional(),
  isDebt: z.boolean().optional(),
  customRate: z.number().positive().optional().nullable(),
  paymentMethod: z.enum(["CASH", "MOBILE_MONEY", "BANK_TRANSFER", "BANK_DEPOSIT"]).optional(),
  commissionXaf: z
    .number()
    .min(0, "La commission ne peut pas être négative")
    .refine((value) => decimalPlaces(value) <= 2, "Maximum 2 décimales")
    .optional()
    .nullable(),
});

export const rateUpdateSchema = z
  .object({
    currencyCode: z.string().min(3).max(3),
    buyRate: z.number().positive(),
    sellRate: z.number().positive(),
  })
  .superRefine((value, ctx) => {
    if (value.sellRate < value.buyRate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le sellRate doit être supérieur ou égal au buyRate",
        path: ["sellRate"],
      });
    }
  });

export const clientSchema = z.object({
  name: z.string().min(2, "Nom trop court").max(100),
  contact: z.string().max(100).optional().or(z.literal("")),
});

export const clientRateSchema = z.object({
  currencyCode: z.string().min(3).max(3),
  buyRate: z.number().positive().optional().nullable(),
  sellRate: z.number().positive().optional().nullable(),
});

export const clientDebtAdjustmentSchema = z.object({
  currencyCode: z
    .string()
    .trim()
    .length(3)
    .transform((value) => value.toUpperCase()),
  amount: z.number().positive(),
  operation: z.enum(["INCREASE", "DECREASE"]),
  note: z.string().trim().max(200).optional().or(z.literal("")),
});

export const currencySchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3)
      .max(3)
      .transform((value) => value.toUpperCase()),
    name: z.string().trim().min(2).max(80),
    flagCode: z.string().trim().min(2).max(8),
    buyRate: z.number().positive(),
    sellRate: z.number().positive(),
  })
  .superRefine((value, ctx) => {
    if (value.sellRate < value.buyRate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le taux de vente doit etre superieur ou egal au taux d'achat",
        path: ["sellRate"],
      });
    }
  });
