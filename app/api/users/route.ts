import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createLog } from "@/lib/logs";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "AGENT"])
});

export async function POST(request: Request) {
  const { user: currentUser } = await getServerSession();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email }
    });

    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role,
        isActive: true
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
    });

    await createLog({
      category: "USER",
      action: "CREATE_USER",
      details: `Nouvel utilisateur: ${user.name} (${user.role})`,
      userId: currentUser.id
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
