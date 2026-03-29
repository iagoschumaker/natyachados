// API: Registrar clique em um link (chamado pelo frontend antes do redirect)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.link.update({
      where: { id: parseInt(id) },
      data: { clicks: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erro ao registrar clique" },
      { status: 500 }
    );
  }
}
