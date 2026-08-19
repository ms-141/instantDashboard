import nodemailer from 'nodemailer'

let cachedTransporter: nodemailer.Transporter | null = null

/**
 * Lazily creates a Nodemailer transporter authenticated directly against
 * Gmail's SMTP servers using an account App Password. This sends emails as
 * the real mailbox (e.g. instant@telus.net, which Telus routes through
 * Google Workspace) rather than through a third-party ESP — so there's no
 * separate domain-verification step, since you're just logging in and
 * sending as yourself.
 *
 * Requires 2-Step Verification enabled on the Google account and an
 * App Password generated for this app (Google Account -> Security ->
 * App Passwords). Regular account passwords will not work here.
 */
export function getMailer() {
  if (cachedTransporter) return cachedTransporter

  const user = process.env.GMAIL_SMTP_USER
  const pass = process.env.GMAIL_SMTP_APP_PASSWORD
  if (!user || !pass) {
    throw new Error('Missing GMAIL_SMTP_USER or GMAIL_SMTP_APP_PASSWORD environment variable')
  }

  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  })

  return cachedTransporter
}

/** The "From" address used for all CRM emails — must match GMAIL_SMTP_USER. */
export function getEmailFromAddress() {
  return process.env.EMAIL_FROM_ADDRESS || process.env.GMAIL_SMTP_USER || 'instant@telus.net'
}

/**
 * Absolute base URL of the deployed app, used to build tracking pixel and
 * click-redirect links that must resolve from the recipient's email client
 * (i.e. cannot be relative).
 */
export function getAppBaseUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL
  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_APP_URL environment variable')
  }
  return url.replace(/\/+$/, '')
}
