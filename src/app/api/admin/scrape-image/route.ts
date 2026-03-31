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

    // Try multiple User-Agents — some sites block bots
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
      "WhatsApp/2.23.20.0",
    ];

    let html = "";
    let fetchSuccess = false;

    for (const ua of userAgents) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": ua,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "Accept-Encoding": "identity",
          },
          redirect: "follow",
          signal: AbortSignal.timeout(15000),
        });

        if (response.ok) {
          html = await response.text();
          fetchSuccess = true;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!fetchSuccess || !html) {
      return NextResponse.json(
        { imageUrl: null, title: null, message: "Não foi possível acessar a URL" },
        { status: 200 }
      );
    }

    // Try to extract image in priority order — multiple patterns for maximum compatibility
    let imageUrl =
      extractMetaContent(html, "og:image") ||
      extractMetaContent(html, "twitter:image") ||
      extractMetaContent(html, "twitter:image:src") ||
      extractMetaContent(html, "product:image") ||
      extractMetaContent(html, "image") ||
      extractLdJsonImage(html) ||
      extractFirstLargeImage(html, url) ||
      null;

    // Also try to extract the title
    let title =
      extractMetaContent(html, "og:title") ||
      extractMetaContent(html, "twitter:title") ||
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
      try {
        const urlObj = new URL(url);
        imageUrl = urlObj.origin + imageUrl;
      } catch {
        // ignore
      }
    }

    // Clean up common URL issues
    imageUrl = imageUrl.split("&amp;").join("&");

    return NextResponse.json({ imageUrl, title });
  } catch (error) {
    console.error("Erro ao fazer scraping:", error);
    return NextResponse.json(
      { imageUrl: null, title: null, error: "Erro ao buscar dados da URL" },
      { status: 200 }
    );
  }
}

// Extract content from meta tags — handles all common patterns
function extractMetaContent(html: string, name: string): string | null {
  // Normalize: try both property and name attributes, various quote styles
  const patterns = [
    // property="og:image" content="..."
    new RegExp(`<meta[^>]*(?:property|name)\\s*=\\s*["']${escapeRegex(name)}["'][^>]*content\\s*=\\s*["']([^"']+)["']`, "i"),
    // content="..." property="og:image"
    new RegExp(`<meta[^>]*content\\s*=\\s*["']([^"']+)["'][^>]*(?:property|name)\\s*=\\s*["']${escapeRegex(name)}["']`, "i"),
    // itemprop="image" content="..."
    new RegExp(`<meta[^>]*itemprop\\s*=\\s*["']${escapeRegex(name)}["'][^>]*content\\s*=\\s*["']([^"']+)["']`, "i"),
    // content="..." itemprop="image"
    new RegExp(`<meta[^>]*content\\s*=\\s*["']([^"']+)["'][^>]*itemprop\\s*=\\s*["']${escapeRegex(name)}["']`, "i"),
  ];

  for (const regex of patterns) {
    const match = regex.exec(html);
    if (match && match[1]) {
      const value = decodeHTMLEntities(match[1].trim());
      if (value.length > 5) return value;
    }
  }

  return null;
}

// Extract image from JSON-LD structured data (used by many e-commerce sites)
function extractLdJsonImage(html: string): string | null {
  const scriptRegex = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1]);
      // Direct image property
      if (json.image) {
        if (typeof json.image === "string") return json.image;
        if (Array.isArray(json.image) && json.image[0]) {
          return typeof json.image[0] === "string" ? json.image[0] : json.image[0].url;
        }
        if (json.image.url) return json.image.url;
      }
      // Product type
      if (json["@type"] === "Product" && json.image) {
        if (typeof json.image === "string") return json.image;
        if (Array.isArray(json.image)) return json.image[0];
      }
      // Check @graph array
      if (json["@graph"]) {
        for (const item of json["@graph"]) {
          if (item.image) {
            if (typeof item.image === "string") return item.image;
            if (item.image.url) return item.image.url;
          }
        }
      }
    } catch {
      // Invalid JSON, skip
    }
  }
  return null;
}

// Fallback: find the first large image in HTML
function extractFirstLargeImage(html: string, baseUrl: string): string | null {
  const imgRegex = /<img[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let match;
  const candidates: string[] = [];

  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    // Skip tiny images, icons, tracking pixels, data URIs
    if (
      src.startsWith("data:") ||
      src.includes("pixel") ||
      src.includes("tracker") ||
      src.includes("spacer") ||
      src.includes("1x1") ||
      src.includes("blank.") ||
      src.includes("logo") ||
      src.includes("icon") ||
      src.includes("sprite") ||
      src.includes("avatar") ||
      src.endsWith(".svg") ||
      src.endsWith(".gif")
    ) {
      continue;
    }

    // Check for size hints in the tag
    const fullTag = match[0];
    const widthMatch = /width\s*=\s*["']?(\d+)/i.exec(fullTag);
    const heightMatch = /height\s*=\s*["']?(\d+)/i.exec(fullTag);

    if (widthMatch && heightMatch) {
      const w = parseInt(widthMatch[1]);
      const h = parseInt(heightMatch[1]);
      if (w < 80 || h < 80) continue; // Skip small images
    }

    candidates.push(src);
    if (candidates.length >= 3) break;
  }

  if (candidates.length > 0) {
    let img = candidates[0];
    if (img.startsWith("//")) img = "https:" + img;
    else if (img.startsWith("/")) {
      try {
        const urlObj = new URL(baseUrl);
        img = urlObj.origin + img;
      } catch { /* ignore */ }
    }
    return img;
  }

  return null;
}

function extractHTMLTitle(html: string): string | null {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return match ? decodeHTMLEntities(match[1].trim()).substring(0, 200) : null;
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
