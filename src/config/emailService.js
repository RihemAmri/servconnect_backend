// utils/emailService.js
import nodemailer from "nodemailer";

export const sendResetEmail = async (to, resetLink) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // tu peux changer si tu veux (Outlook, etc)
    auth: {
      user: process.env.SMTP_EMAIL, // ton email
      pass: process.env.SMTP_PASSWORD, // ton mot de passe ou App Password
    },
  });

  const mailOptions = {
    from: `"ServConnect" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: "Réinitialisation de votre mot de passe",
    html: `
      <p>Bonjour 👋,</p>
      <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
      <p>Cliquez sur le lien ci-dessous pour le réinitialiser (valable 15 minutes) :</p>
      <a href="${resetLink}" target="_blank">${resetLink}</a>
      <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
      <p>— L'équipe ServConnect</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
