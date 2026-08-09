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

export interface WeeklyDigestEntry {
  prenom: string;
  nom: string;
  joursAbsence: number;
  retards: number;
}

export async function sendWeeklyDigest(
  toEmail: string,
  period: { debut: string; fin: string },
  entries: WeeklyDigestEntry[],
): Promise<void> {
  const user = process.env.GMAIL_USER;
  if (!user) throw new Error("GMAIL_USER manquant.");

  const rows = entries.length
    ? entries
        .map(
          (e) =>
            `<tr><td style="padding:6px 12px;border-bottom:1px solid #E2E8F0;">${e.prenom} ${e.nom}</td><td style="padding:6px 12px;border-bottom:1px solid #E2E8F0;text-align:center;">${e.joursAbsence}</td><td style="padding:6px 12px;border-bottom:1px solid #E2E8F0;text-align:center;">${e.retards}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="3" style="padding:12px;color:#475569;">Aucune absence ni retard cette semaine.</td></tr>`;

  await getTransporter().sendMail({
    to: toEmail,
    from: `"Pointage stages ENSEA" <${user}>`,
    subject: `Récapitulatif hebdomadaire — Pointage stagiaires (${period.debut} au ${period.fin})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <p style="color:#0F172A;">Bonjour,</p>
        <p style="color:#0F172A;">Récapitulatif des absences et retards des stagiaires ENSEA du ${period.debut} au ${period.fin} :</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <thead>
            <tr style="background:#EFF6FF;">
              <th style="padding:6px 12px;text-align:left;">Stagiaire</th>
              <th style="padding:6px 12px;">Absences</th>
              <th style="padding:6px 12px;">Retards</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="color:#475569;font-size:14px;">Récapitulatif automatique hebdomadaire — dashboard : voir le tableau complet en ligne.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetCode(toEmail: string, code: string): Promise<void> {
  const user = process.env.GMAIL_USER;
  if (!user) throw new Error("GMAIL_USER manquant.");

  await getTransporter().sendMail({
    to: toEmail,
    from: `"Pointage stages ENSEA" <${user}>`,
    subject: "Réinitialisation du mot de passe — Pointage stages ENSEA",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <p style="color:#0F172A;">Bonjour,</p>
        <p style="color:#0F172A;">Voici votre code pour réinitialiser votre mot de passe du pointage des stagiaires ENSEA :</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:6px;color:#1E40AF;text-align:center;margin:24px 0;">
          ${code}
        </p>
        <p style="color:#475569;font-size:14px;">Ce code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message — votre mot de passe reste inchangé.</p>
      </div>
    `,
  });
}
