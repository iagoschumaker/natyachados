// API: CRUD de Links (GET todos / POST novo)
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SessionData, sessionOptions } from "@/lib/auth";

// Listar todos os links (admin)
export async function GET() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const links = await prisma.link.findMany({
    orderBy: { order: "asc" },
  });
  return NextResponse.json(links);
}

// Criar novo link
export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const data = await req.json();

    // Pega a maior ordem existente
    const maxOrder = await prisma.link.aggregate({
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order || 0) + 1;

    const link = await prisma.link.create({
      data: {
        title: data.title,
        url: data.url,
        imageUrl: data.imageUrl || null,
        icon: data.icon || null,
        order: data.order ?? nextOrder,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        notes: data.notes || null,
      },
    });

    return NextResponse.json(link, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erro ao criar link" },
      { status: 500 }
    );
  }
}
