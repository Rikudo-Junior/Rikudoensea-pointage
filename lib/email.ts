import sgMail from "@sendgrid/mail";

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error("SENDGRID_API_KEY manquant.");
  sgMail.setApiKey(apiKey);
  configured = true;
}

export function generateVerificationCode(): string {
  return (Math.floor(100000 + Math.random() * 900000)).toString();
}

export async function sendVerificationCode(toEmail: string, code: string): Promise<void> {
  ensureConfigured();
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  if (!fromEmail) throw new Error("SENDGRID_FROM_EMAIL manquant.");

  await sgMail.send({
    to: toEmail,
    from: fromEmail,
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
