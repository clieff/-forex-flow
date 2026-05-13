import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { reconstructLogs } from "@/lib/logs";

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await reconstructLogs();
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error("Failed to reconstruct logs:", error);
    return NextResponse.json({ error: "Failed to reconstruct logs" }, { status: 500 });
  }
}
