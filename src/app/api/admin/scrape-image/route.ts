// API: Scraping de imagem de produto via Open Graph / meta tags
// Funciona com qualquer plataforma (Shopee, Amazon, Shein, Mercado Livre, AliExpress, etc.)
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL é obrigatória" },
        { status: 400 }
      );
    }

    // Fetch the page HTML server-side (no CORS issues)
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Não foi possível acessar a URL" },
        { status: 400 }
      );
    }

    const html = await response.text();

    // Try to extract image in priority order
    let imageUrl = extractMetaContent(html, 'property="og:image"') ||
      extractMetaContent(html, "property='og:image'") ||
      extractMetaContent(html, 'name="og:image"') ||
      extractMetaContent(html, "name='og:image'") ||
      extractMetaContent(html, 'property="twitter:image"') ||
      extractMetaContent(html, "property='twitter:image'") ||
      extractMetaContent(html, 'name="twitter:image"') ||
      extractMetaContent(html, "name='twitter:image'") ||
      extractMetaContent(html, 'name="twitter:image:src"') ||
      null;

    // Also try to extract the title if available
    let title = extractMetaContent(html, 'property="og:title"') ||
      extractMetaContent(html, "property='og:title'") ||
      extractHTMLTitle(html) ||
      null;

    if (!imageUrl) {
      return NextResponse.json(
        { imageUrl: null, title, message: "Nenhuma imagem encontrada" },
        { status: 200 }
      );
    }

    // Handle relative URLs
    if (imageUrl.startsWith("//")) {
      imageUrl = "https:" + imageUrl;
    } else if (imageUrl.startsWith("/")) {
      const urlObj = new URL(url);
      imageUrl = urlObj.origin + imageUrl;
    }

    return NextResponse.json({ imageUrl, title });
  } catch (error) {
    console.error("Erro ao fazer scraping:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados da URL" },
      { status: 500 }
    );
  }
}

// Extract content from meta tag — handles various quote/order patterns
function extractMetaContent(html: string, attribute: string): string | null {
  // Pattern 1: <meta attribute content="value">
  const regex1 = new RegExp(
    `<meta[^>]*${escapeRegex(attribute)}[^>]*content=["']([^"']+)["'][^>]*/?>`,
    "i"
  );
  const match1 = regex1.exec(html);
  if (match1) return match1[1];

  // Pattern 2: <meta content="value" attribute>
  const regex2 = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*${escapeRegex(attribute)}[^>]*/?>`,
    "i"
  );
  const match2 = regex2.exec(html);
  if (match2) return match2[1];

  return null;
}

function extractHTMLTitle(html: string): string | null {
  const match = /<title[^>]*>(.*?)<\/title>/i.exec(html);
  return match ? decodeHTMLEntities(match[1].trim()) : null;
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
