// API: Reordenar links (atualizar a ordem de múltiplos links de uma vez)
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SessionData, sessionOptions } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { orderedIds } = await req.json();

    // Atualiza a ordem de cada link
    const updates = orderedIds.map((id: number, index: number) =>
      prisma.link.update({
        where: { id },
        data: { order: index + 1 },
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erro ao reordenar links" },
      { status: 500 }
    );
  }
}
