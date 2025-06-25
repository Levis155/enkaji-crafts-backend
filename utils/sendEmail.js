import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"Enkaji Orders" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

export const sendOrderConfirmationEmail = async ({
  to,
  name,
  orderNumber,
  total,
}) => {
  const subject = `Order Confirmation - ${orderNumber}`;
  const html = `
    <h2>Hi ${name},</h2>
    <p>Thank you for your order!</p>
    <p><strong>Order No:</strong> ${orderNumber}</p>
    <p><strong>Total:</strong> Ksh ${total}</p>
    <p>We'll contact you shortly to confirm delivery.</p>
    <br />
    <p>— Enkaji Team</p>
  `;

  await sendEmail({ to, subject, html });
};

export const sendAdminOrderNotification = async ({
  name,
  email,
  phone,
  orderNumber,
  total,
  address,
}) => {
  const subject = `New Paid Order - #${orderNumber}`;
  const html = `
    <h2>New Order Received</h2>
    <p><strong>Customer:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Order No:</strong> ${orderNumber}</p>
    <p><strong>Total:</strong> Ksh ${total}</p>
    <p><strong>Delivery Address:</strong> ${address}</p>
    <br />
    <p>Login to your dashboard to view and fulfill the order.</p>
  `;

  await sendEmail({ to: process.env.ADMIN_EMAIL, subject, html });
};

export const sendPasswordResetEmail = async ({ to, name, resetLink }) => {
  const subject = "Password Reset - Enkaji Crafts";
  const html = `
    <h2>Hi ${name},</h2>
    <p>You requested to reset your password for your Enkaji account.</p>
    <p>Click the link below to reset your password. This link will expire in 15 minutes:</p>
    <p><a href="${resetLink}" target="_blank">CLICK ON THIS LINK TO RESET YOUR PASSWORD</a></p>
    <br />
    <p>If you didn’t request this, you can safely ignore this email.</p>
    <p>— Enkaji Crafts Team</p>
  `;

  await sendEmail({ to, subject, html });
};

