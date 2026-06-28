import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getServerSession } from "@/lib/auth-session";
import { getTransactionById } from "@/lib/dashboard";
import { ReceiptDocument } from "@/components/pdf/receipt-document";
import QRCode from "qrcode";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { user } = await getServerSession();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const transaction = await getTransactionById(params.id);

  if (!transaction) {
    return new Response("Not found", { status: 404 });
  }

  const isAdmin = user.role === "ADMIN";
  const isOwner = transaction.createdById === user.id;
  if (!isAdmin && !isOwner) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    // Génération du QR Code
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify/${transaction.id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 100,
      margin: 1,
      color: { dark: "#0A0F1A", light: "#FFFFFF" }
    });

    // Switch to renderToBuffer for better stability in Next.js routes
    const buffer = await renderToBuffer(<ReceiptDocument transaction={transaction as any} qrCodeDataUrl={qrCodeDataUrl} />);

    return new Response(buffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="receipt-${transaction.id}.pdf"`,
        "Cache-Control": "no-store, max-age=0"
      }
    });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return new Response("Error generating PDF", { status: 500 });
  }
}
