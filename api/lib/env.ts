import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  isProduction: process.env.NODE_ENV === "production",
  /** String de conexão MySQL (mysql://user:pass@host:port/db) */
  databaseUrl: required("DATABASE_URL"),
  /** Segredo longo usado para assinar o JWT da sessão */
  jwtSecret: required("JWT_SECRET"),
  /** Bootstrap do primeiro admin: criado no boot se não existir */
  adminEmail: process.env.ADMIN_EMAIL ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  /** E-mails transacionais (Resend) — vazio = no-op com log */
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "IsentaTáxi <ola@isentataxi.com.br>",
};
