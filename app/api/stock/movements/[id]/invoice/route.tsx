import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getServerSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { SupplierInvoiceDocument } from "@/components/pdf/supplier-invoice-document";
import QRCode from "qrcode";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await getServerSession();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const move = await prisma.stockMovement.findUnique({
    where: { id },
    include: {
      currency: true,
      supplier: true,
      createdBy: {
        select: { name: true }
      }
    }
  });

  if (!move) {
    return new Response("Not found", { status: 404 });
  }

  if (move.reason !== "SUPPLIER_PURCHASE" && move.reason !== "DEBT_SETTLEMENT") {
    return new Response("Not a supplier purchase", { status: 400 });
  }

  const isAdmin = user.role === "ADMIN";
  const isOwner = move.createdById === user.id;
  if (!isAdmin && !isOwner) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify/stock/${move.id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 100,
      margin: 1,
      color: { dark: "#0A0F1A", light: "#FFFFFF" }
    });

    const invoice = {
      invoiceNumber: `FAC-${move.id.slice(0, 8).toUpperCase()}`,
      date: new Date(move.createdAt).toLocaleString("fr-FR"),
      supplierName: move.supplier?.name ?? "Fournisseur inconnu",
      supplierContact: move.supplier?.contact ?? null,
      currencyCode: move.currencyCode,
      currencyName: move.currency.name,
      amount: Number(move.unitPrice && move.unitPrice.gt(0)
        ? move.totalCostXaf?.div(move.unitPrice) ?? move.amount
        : move.amount
      ),
      unitPrice: Number(move.unitPrice ?? 0),
      totalCostXaf: Number(move.totalCostXaf ?? 0),
      receivedAmount: Number(move.amount),
      note: move.note,
      agentName: move.createdBy.name
    };

    const buffer = await renderToBuffer(
      <SupplierInvoiceDocument invoice={invoice} qrCodeDataUrl={qrCodeDataUrl} />
    );

    return new Response(buffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="facture-fournisseur-${move.id.slice(0, 8)}.pdf"`,
        "Cache-Control": "no-store, max-age=0"
      }
    });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return new Response("Error generating PDF", { status: 500 });
  }
}
