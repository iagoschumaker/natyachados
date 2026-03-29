// API: Operações em link individual (PUT atualizar / DELETE excluir)
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SessionData, sessionOptions } from "@/lib/auth";

// Atualizar link
export async function PUT(
  req: NextRequest,
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
    const data = await req.json();

    const link = await prisma.link.update({
      where: { id: parseInt(id) },
      data: {
        title: data.title,
        url: data.url,
        icon: data.icon,
        order: data.order,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        notes: data.notes,
      },
    });

    return NextResponse.json(link);
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar link" },
      { status: 500 }
    );
  }
}

// Excluir link
export async function DELETE(
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
    await prisma.link.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erro ao excluir link" },
      { status: 500 }
    );
  }
}
