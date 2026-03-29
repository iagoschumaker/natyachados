// API: Configurações do site (GET / PUT)
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SessionData, sessionOptions } from "@/lib/auth";

// Obter configurações
export async function GET() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const settings = await prisma.siteSettings.findUnique({
    where: { id: 1 },
  });

  return NextResponse.json(settings);
}

// Atualizar configurações
export async function PUT(req: NextRequest) {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const data = await req.json();

    const settings = await prisma.siteSettings.upsert({
      where: { id: 1 },
      update: {
        siteTitle: data.siteTitle,
        siteSubtitle: data.siteSubtitle,
        logoUrl: data.logoUrl,
        footerText: data.footerText,
        primaryColor: data.primaryColor,
        backgroundColor: data.backgroundColor,
        faviconUrl: data.faviconUrl,
        headScripts: data.headScripts,
      },
      create: {
        id: 1,
        siteTitle: data.siteTitle || "Naty Achados",
        siteSubtitle: data.siteSubtitle || "Achados que valem a pena ✨",
        footerText: data.footerText || "© Naty Achados",
        primaryColor: data.primaryColor || "#8B5CF6",
        backgroundColor: data.backgroundColor || "#F8F7FF",
      },
    });

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar configurações" },
      { status: 500 }
    );
  }
}
