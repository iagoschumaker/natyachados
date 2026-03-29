// ==========================================================
// SEED - Cria o primeiro usuário admin e configurações padrão
// ==========================================================
// Para rodar: npx prisma db seed
// 
// ⚠️  IMPORTANTE: Troque a senha padrão após o primeiro login!
//     Usuário padrão: admin
//     Senha padrão:   admin123
// ==========================================================

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Cria usuário admin (se não existir)
  const existingUser = await prisma.user.findUnique({
    where: { username: "admin" },
  });

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash("admin123", 12);
    await prisma.user.create({
      data: {
        username: "admin",
        passwordHash: hashedPassword,
      },
    });
    console.log("✅ Usuário admin criado (admin / admin123)");
  } else {
    console.log("ℹ️  Usuário admin já existe, pulando...");
  }

  // Cria configurações padrão (se não existir)
  const existingSettings = await prisma.siteSettings.findUnique({
    where: { id: 1 },
  });

  if (!existingSettings) {
    await prisma.siteSettings.create({
      data: {
        id: 1,
        siteTitle: "Naty Achados",
        siteSubtitle: "Achados que valem a pena ✨",
        footerText: "© Naty Achados",
        primaryColor: "#8B5CF6",
        backgroundColor: "#F8F7FF",
      },
    });
    console.log("✅ Configurações padrão criadas");
  } else {
    console.log("ℹ️  Configurações já existem, pulando...");
  }

  // Cria alguns links de exemplo
  const linkCount = await prisma.link.count();
  if (linkCount === 0) {
    await prisma.link.createMany({
      data: [
        {
          title: "🛍️ TikTok Shop - Meus Achados",
          url: "https://www.tiktok.com",
          order: 1,
          isActive: true,
          isFeatured: true,
        },
        {
          title: "💬 WhatsApp",
          url: "https://wa.me/5500000000000",
          order: 2,
          isActive: true,
          isFeatured: false,
        },
        {
          title: "🎵 TikTok",
          url: "https://www.tiktok.com/@natyachados",
          order: 3,
          isActive: true,
          isFeatured: false,
        },
        {
          title: "📸 Instagram",
          url: "https://www.instagram.com/natyachados",
          order: 4,
          isActive: true,
          isFeatured: false,
        },
      ],
    });
    console.log("✅ Links de exemplo criados");
  } else {
    console.log("ℹ️  Links já existem, pulando...");
  }
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
