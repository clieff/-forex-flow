import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { getSuppliersOverview } from "@/lib/suppliers";
import { createLog } from "@/lib/logs";
import { isAdminRole } from "@/lib/roles";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { user } = await getServerSession();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const suppliers = await getSuppliersOverview();
  const supplier = suppliers.find((entry) => entry.id === params.id);

  if (!supplier) {
    return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
  }

  return NextResponse.json({ supplier });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { user } = await getServerSession();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { name?: string; contact?: string };
  const data: { name?: string; contact?: string | null } = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    data.name = name;
  }
  if (typeof body.contact === "string") {
    data.contact = body.contact.trim() || null;
  }

  const supplier = await prisma.supplier.update({
    where: { id: params.id },
    data
  });

  await createLog({
    category: "STOCK",
    action: "UPDATE_SUPPLIER",
    details: `Fournisseur mis a jour: ${supplier.name}`,
    userId: user.id
  });

  return NextResponse.json({ supplier });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { user } = await getServerSession();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.supplier.delete({ where: { id: params.id } });

  await createLog({
    category: "STOCK",
    action: "DELETE_SUPPLIER",
    details: `Suppression fournisseur: ${params.id}`,
    userId: user.id
  });

  return NextResponse.json({ ok: true });
}
