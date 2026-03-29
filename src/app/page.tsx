// ==========================================================
// PÁGINA PÚBLICA - A página principal que os visitantes veem
// ==========================================================
// Esta é a página servida em /
// Mostra os links ativos em ordem, com visual premium
// ==========================================================

import { prisma } from "@/lib/prisma";
import LinkButton from "@/components/LinkButton";
// Using native <img> for dynamic uploads (logo)
import type { Metadata } from "next";

// SEO: Gera metadata dinâmica a partir das configurações
export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });

  return {
    title: settings?.siteTitle || "Naty Achados",
    description: settings?.siteSubtitle || "Achados que valem a pena",
    openGraph: {
      title: settings?.siteTitle || "Naty Achados",
      description: settings?.siteSubtitle || "Achados que valem a pena",
      type: "website",
      url: "https://natyachados.com.br",
      ...(settings?.logoUrl && {
        images: [{ url: settings.logoUrl, width: 400, height: 400 }],
      }),
    },
    twitter: {
      card: "summary",
      title: settings?.siteTitle || "Naty Achados",
      description: settings?.siteSubtitle || "Achados que valem a pena",
    },
    icons: settings?.faviconUrl ? { icon: settings.faviconUrl } : undefined,
  };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicPage() {
  // Busca dados do banco
  const [settings, links] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: 1 } }),
    prisma.link.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    }),
  ]);

  const title = settings?.siteTitle || "Naty Achados";
  const subtitle = settings?.siteSubtitle || "Achados que valem a pena ✨";
  const logoUrl = settings?.logoUrl;
  const footerText = settings?.footerText || "© Naty Achados";
  const primaryColor = settings?.primaryColor || "#8B5CF6";
  const backgroundColor = settings?.backgroundColor || "#F8F7FF";
  const headScripts = settings?.headScripts;

  return (
    <>
      {/* Scripts extras (Analytics, Pixel, etc) */}
      {headScripts && (
        <script
          dangerouslySetInnerHTML={{ __html: headScripts }}
          suppressHydrationWarning
        />
      )}

      <div
        className="min-h-screen flex flex-col"
        style={{ backgroundColor }}
      >
        {/* Decorative background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: primaryColor }}
          />
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-15"
            style={{ backgroundColor: primaryColor }}
          />
        </div>

        {/* Main content */}
        <main className="flex-1 flex items-start justify-center relative z-10">
          <div className="w-full max-w-md mx-auto px-4 py-12 sm:py-16">
            {/* Profile section */}
            <div className="text-center mb-10 animate-fade-in">
              {/* Logo / Avatar */}
              <div className="relative mx-auto mb-5">
                {logoUrl ? (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mx-auto ring-4 ring-white shadow-xl">
                    <img
                      src={logoUrl}
                      alt={title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full mx-auto flex items-center justify-center ring-4 ring-white shadow-xl text-white text-4xl font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${adjustColor(primaryColor, -30)})`,
                    }}
                  >
                    {title.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Online indicator */}
                <div className="absolute bottom-1 right-1/2 translate-x-10 sm:translate-x-12 w-5 h-5 bg-green-400 rounded-full border-[3px] border-white" />
              </div>

              {/* Name */}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                {title}
              </h1>

              {/* Subtitle */}
              <p className="text-gray-500 text-sm sm:text-base max-w-xs mx-auto">
                {subtitle}
              </p>
            </div>

            {/* Links */}
            <div className="space-y-3 animate-slide-up">
              {links.map((link, index) => (
                <div
                  key={link.id}
                  style={{
                    animationDelay: `${index * 80}ms`,
                  }}
                  className="animate-slide-up"
                >
                  <LinkButton
                    id={link.id}
                    title={link.title}
                    url={link.url}
                    icon={link.icon}
                    isFeatured={link.isFeatured}
                    primaryColor={primaryColor}
                  />
                </div>
              ))}

              {links.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-sm">
                    Nenhum link disponível no momento
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center py-6 relative z-10">
          <p className="text-gray-400 text-xs">{footerText}</p>
        </footer>
      </div>
    </>
  );
}

// Função auxiliar para escurecer/clarear cores hex
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
