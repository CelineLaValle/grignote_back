const nodemailer = require('nodemailer');

// Création du transporteur Mailtrap
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "1490e62edb17b8", // User Mailtrap
    pass: "70687f74f48f22"  // Pass Mailtrap
  }
});

// Fonction pour envoyer le mail de confirmation
const sendVerificationMail = async (email, token) => {
  const url = `http://localhost:3000/verify?token=${token}`;

  await transporter.sendMail({
    from: '"Blog de Recettes 🍲" <noreply@monblog.com>',
    to: email,
    subject: "Confirme ton email",
    html: `
      <h2>Bienvenue sur le blog de recettes !</h2>
      <p>Merci pour ton inscription. Pour activer ton compte, clique sur le lien ci-dessous :</p>
      <a href="${url}">Confirmer mon compte</a>
    `
  });
};

module.exports = sendVerificationMail;
