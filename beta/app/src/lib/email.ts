import nodemailer from 'nodemailer'

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: parseInt(process.env.SMTP_PORT || '587') === 465, // true for 465, false for other ports
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    } : undefined,
  })
}

export async function sendSupportEmail({
  from,
  subject,
  message,
  userEmail,
}: {
  from: string
  subject: string
  message: string
  userEmail: string
}) {
  const supportEmail = 'support@caenheborealestate.zendesk.com'

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@caenhebo.com',
    to: supportEmail,
    replyTo: userEmail,
    subject: `Support Request: ${subject}`,
    text: `From: ${userEmail}\n\nSubject: ${subject}\n\nMessage:\n${message}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Support Request</h2>
        <p><strong>From:</strong> ${userEmail}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <h3 style="color: #555;">Message:</h3>
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
    `,
  }

  try {
    const transporter = createTransporter()
    const info = await transporter.sendMail(mailOptions)
    console.log('Support email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending support email:', error)
    throw error
  }
}
