import { env } from "./env";

/**
 * E-mails transacionais via Resend (https://resend.com).
 * Config: RESEND_API_KEY + EMAIL_FROM (ex.: "IsentaTáxi <ola@isentataxi.com.br>").
 * Sem chave configurada, vira no-op com log — nunca quebra o fluxo principal.
 */

const RESEND_URL = "https://api.resend.com/emails";

interface SendInput {
  to: string;
  subject: string;
  html: string;
}

async function send(input: SendInput): Promise<void> {
  if (!env.resendApiKey) {
    console.log(`[email] RESEND_API_KEY ausente — pulando: "${input.subject}" → ${input.to}`);
    return;
  }
  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.emailFrom,
        to: [input.to],
        subject: input.subject,
        html: input.html,
      }),
    });
    if (!res.ok) {
      console.error(`[email] Resend ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.error("[email] falha ao enviar:", err);
  }
}

const shell = (title: string, body: string) => `
<div style="margin:0;padding:0;background:#0A0A0B;font-family:Inter,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <div style="background:repeating-linear-gradient(-45deg,#FACC15 0 12px,#0A0A0B 12px 24px);height:8px;border-radius:4px"></div>
    <h1 style="color:#FAFAFA;font-size:22px;margin:24px 0 12px">${title}</h1>
    <div style="color:#A1A1AA;font-size:15px;line-height:1.6">${body}</div>
    <a href="https://isentataxi.com.br/app" style="display:inline-block;margin-top:24px;background:#FACC15;color:#0A0A0B;font-weight:700;padding:12px 24px;border-radius:999px;text-decoration:none">Acessar meu painel</a>
    <p style="color:#71717A;font-size:12px;margin-top:32px">IsentaTáxi — isenção de IPI/ICMS/IPVA para taxistas de São Paulo.<br>Dúvidas? WhatsApp: https://wa.me/5511942299144</p>
  </div>
</div>`;

/** Boas-vindas após criar conta */
export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const first = name.trim().split(" ")[0] || "taxista";
  await send({
    to,
    subject: "Bem-vindo ao IsentaTáxi — seu painel está pronto 🚕",
    html: shell(
      `Olá, ${first}! Sua conta foi criada.`,
      `<p>Seu processo de isenção já está aberto no painel, com as <strong style="color:#FAFAFA">8 etapas</strong> do benefício (IPI + ICMS + IPVA).</p>
       <p>Próximo passo: complete seu cadastro e envie os documentos — nós cuidamos do resto com você.</p>`,
    ),
  });
}

/** Alerta de documento rejeitado (com motivo) */
export async function sendDocRejectedEmail(
  to: string,
  name: string,
  docName: string,
  reason: string,
): Promise<void> {
  const first = name.trim().split(" ")[0] || "taxista";
  await send({
    to,
    subject: `Documento para reenvio: ${docName}`,
    html: shell(
      `${first}, precisamos de um reenvio.`,
      `<p>O documento <strong style="color:#FAFAFA">${docName}</strong> foi analisado e precisa ser reenviado.</p>
       <p><strong style="color:#FACC15">Motivo:</strong> ${reason}</p>
       <p>Envie novamente pelo painel (Meus documentos) que seguimos com o seu processo.</p>`,
    ),
  });
}

/** Alerta de documento aprovado (positivo, mantém engajamento) */
export async function sendDocApprovedEmail(to: string, name: string, docName: string): Promise<void> {
  const first = name.trim().split(" ")[0] || "taxista";
  await send({
    to,
    subject: `Documento aprovado: ${docName} ✅`,
    html: shell(
      `Boa notícia, ${first}!`,
      `<p>Seu documento <strong style="color:#FAFAFA">${docName}</strong> foi <strong style="color:#22C55E">aprovado</strong>. Seu processo continua avançando.</p>`,
    ),
  });
}
