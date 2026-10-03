import { logEvent } from '~~/server/utils/log'

const SEND_TIMEOUT_MS = 4000
const BREVO_URL = 'https://api.brevo.com/v3/smtp/email'

export interface IMail {
    to: string
    subject: string
    text: string
}

export const isFakeDelivery = (): boolean => process.env.NOTIFY_PROVIDER === 'fake'

export const sendMail = async (mail: IMail): Promise<boolean> => {
    if (isFakeDelivery()) {
        return true
    }
    const apiKey = process.env.BREVO_API_KEY ?? ''
    const sender = process.env.MAIL_FROM ?? ''
    if (apiKey === '' || sender === '') {
        return false
    }
    try {
        const response = await fetch(BREVO_URL, {
            method: 'POST',
            headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
            body: JSON.stringify({ sender: { email: sender, name: process.env.MAIL_FROM_NAME ?? 'Tantara' }, to: [{ email: mail.to }], subject: mail.subject, textContent: mail.text }),
            signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
        })
        return response.ok
    } catch (_error) {
        logEvent('Envoi d’e-mail impossible')
        return false
    }
}

export const mailDeliveryReady = (): boolean => isFakeDelivery() || (Boolean(process.env.BREVO_API_KEY) && Boolean(process.env.MAIL_FROM))

