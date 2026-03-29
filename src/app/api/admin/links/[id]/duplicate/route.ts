// API: Duplicar um link
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SessionData, sessionOptions } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const original = await prisma.link.findUnique({
      where: { id: parseInt(id) },
    });

    if (!original) {
      return NextResponse.json(
        { error: "Link não encontrado" },
        { status: 404 }
      );
    }

    // Pega a maior ordem
    const maxOrder = await prisma.link.aggregate({
      _max: { order: true },
    });

    const duplicate = await prisma.link.create({
      data: {
        title: `${original.title} (cópia)`,
        url: original.url,
        icon: original.icon,
        order: (maxOrder._max.order || 0) + 1,
        isActive: false, // Começa inativo
        isFeatured: false,
        notes: original.notes,
      },
    });

    return NextResponse.json(duplicate, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erro ao duplicar link" },
      { status: 500 }
    );
  }
}
