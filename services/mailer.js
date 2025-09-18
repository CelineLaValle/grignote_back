const nodemailer = require('nodemailer');

// Configuration du transporteur Gmail
const transporter = nodemailer.createTransport({
  service: 'smtp.gmail.com:587',
  auth: {
    user: 'kayaggan@gmail.com',          // ton adresse Gmail
    pass: 'mzzdflebpaycdobw',     // mot de passe d'application Gmail
  },
});

// Fonction pour envoyer le mail de confirmation
const sendVerificationMail = async (email, token) => {
  const url = `http://localhost:3000/verify?token=${token}`;

  try {
    let info = await transporter.sendMail({
      from: '"Blog de Recettes 🍲" <kayaggan@gmail.com>', // ton adresse Gmail
      to: email,
      subject: 'Confirme ton email',
      html: `
        <h2>Bienvenue sur le blog de recettes !</h2>
        <p>Merci pour votre inscription. Pour activer votre compte, cliquez sur le lien ci-dessous :</p>
        <a href="${url}">Confirmer mon compte</a>
      `,
    });

    console.log('✅ Mail envoyé :', info.messageId);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du mail :', error);
  }
};

module.exports = sendVerificationMail;
