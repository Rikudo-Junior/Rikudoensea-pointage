import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD manquant(s).");
  }
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter;
}

export function generateVerificationCode(): string {
  return (Math.floor(100000 + Math.random() * 900000)).toString();
}

export async function sendVerificationCode(toEmail: string, code: string): Promise<void> {
  const user = process.env.GMAIL_USER;
  if (!user) throw new Error("GMAIL_USER manquant.");

  await getTransporter().sendMail({
    to: toEmail,
    from: `"Pointage stages ENSEA" <${user}>`,
    subject: "Code de vérification — Pointage stages ENSEA",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <p style="color:#0F172A;">Bonjour,</p>
        <p style="color:#0F172A;">Voici votre code de vérification pour le pointage des stagiaires ENSEA :</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:6px;color:#1E40AF;text-align:center;margin:24px 0;">
          ${code}
        </p>
        <p style="color:#475569;font-size:14px;">Ce code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>
      </div>
    `,
  });
}
