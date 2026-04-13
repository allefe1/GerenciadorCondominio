import nodemailer from "nodemailer";

type SendResetPasswordMailParams = {
  to: string;
  name: string;
  token: string;
};

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });
}

export async function sendResetPasswordMail({
  to,
  name,
  token,
}: SendResetPasswordMailParams) {
  const resetUrl = `${process.env.APP_URL || "http://localhost:3000"}/recuperar-senha/${token}`;
  const transporter = getTransporter();

  if (!transporter) {
    console.log("[recuperacao-senha]", { to, name, resetUrl });
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "Recuperação de senha - CondoReserva",
    html: `
      <div style="font-family: Inter, Arial, sans-serif; line-height: 1.6;">
        <h2>Olá, ${name}</h2>
        <p>Recebemos uma solicitação para redefinir sua senha no CondoReserva.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#5416c9;color:#fff;border-radius:12px;text-decoration:none;font-weight:700;">
            Redefinir senha
          </a>
        </p>
        <p>Se você não solicitou esta alteração, ignore este e-mail.</p>
      </div>
    `,
  });
}
