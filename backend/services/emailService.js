const isProd = process.env.NODE_ENV === 'production';

const SUBJECTS = {
  restock: productName => `Back in stock: ${productName}`,
  price_drop: (productName, price) => `Price dropped to $${price}: ${productName}`,
};

const BODIES = {
  restock: (productName, productId) =>
    `Great news! ${productName} is back in stock. Visit https://fusion-electronics.vercel.app/product/${productId} to grab yours before it sells out.`,
  price_drop: (productName, productId, price) =>
    `The price of ${productName} has dropped to $${price}! Visit https://fusion-electronics.vercel.app/product/${productId} to take advantage of this deal.`,
};

async function sendRestockEmail({ to, productName, productId }) {
  const subject = SUBJECTS.restock(productName);
  const body = BODIES.restock(productName, productId);
  return _send({ to, subject, body });
}

async function sendPriceDropEmail({ to, productName, productId, price }) {
  const subject = SUBJECTS.price_drop(productName, price);
  const body = BODIES.price_drop(productName, productId, price);
  return _send({ to, subject, body });
}

async function _send({ to, subject, body }) {
  if (!isProd || !process.env.SENDGRID_API_KEY) {
    console.log(`[emailService] DEV — To: ${to} | Subject: ${subject}\n${body}`);
    return;
  }

  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  await sgMail.send({
    to,
    from: process.env.SENDGRID_FROM_EMAIL || 'no-reply@fusion-electronics.com',
    subject,
    text: body,
  });
}

module.exports = { sendRestockEmail, sendPriceDropEmail };
