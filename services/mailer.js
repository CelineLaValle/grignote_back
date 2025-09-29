const nodemailer = require('nodemailer');

// Configuration du transporteur Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
  },
});

// Fonction pour envoyer le mail de confirmation
const sendVerificationMail = async (email, token) => {
  const url = `http://localhost:3000/verify?token=${token}`;

  try {
    let info = await transporter.sendMail({
      from: `'Blog de Recettes 🍲' <${process.env.GMAIL_USER}>`, // ton adresse Gmail
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
    console.error('Erreur détaillée lors de l\'envoi du mail :');
  }
};

module.exports = sendVerificationMail;
