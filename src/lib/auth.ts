// ==========================================================
// AUTENTICAÇÃO - Configuração de sessão com iron-session
// ==========================================================
// Para alterar a senha secreta da sessão, edite o SESSION_SECRET
// no arquivo .env
// ==========================================================

import { SessionOptions } from "iron-session";

export interface SessionData {
  userId?: number;
  username?: string;
  isLoggedIn?: boolean;
}

// ⚠️  IMPORTANTE: Troque o SESSION_SECRET no .env em produção!
export const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    "complex_password_at_least_32_characters_long_naty_achados_2024",
  cookieName: "naty-achados-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  },
};

export const defaultSession: SessionData = {
  isLoggedIn: false,
};
