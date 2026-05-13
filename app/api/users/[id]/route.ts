import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createLog } from "@/lib/logs";

const updateUserSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(["ADMIN", "AGENT"]).optional()
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Empêcher l'admin de se désactiver lui-même
  if (params.id === session.user.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas modifier votre propre compte." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: parsed.data,
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
    });

    await createLog({
      category: "USER",
      action: "UPDATE_USER",
      details: `Mise à jour utilisateur: ${user.name} (Active: ${user.isActive}, Role: ${user.role})`,
      userId: session.user.id
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
