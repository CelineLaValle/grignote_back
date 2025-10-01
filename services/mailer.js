const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  connectionTimeout: 10000,
});

// Fonction pour envoyer le mail de confirmation
const sendVerificationMail = async (email, token) => {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
  const url = `${FRONTEND_URL}/verify?token=${token}`;

  try {
    let info = await transporter.sendMail({
      from: `'Blog de Recettes 🍲' <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Confirme ton email',
      html: `
        <h2>Bienvenue sur le blog de recettes !</h2>
        <p>Merci pour votre inscription. Pour activer votre compte, cliquez sur le lien ci-dessous :</p>
        <a href='${url}'>Confirmer mon compte</a>
      `,
    });

    console.log('Mail envoyé avec succès :', info.messageId);
  } catch (error) {
    console.error('Erreur détaillée lors de l\'envoi du mail :', error);
  }
};

module.exports = sendVerificationMail;
