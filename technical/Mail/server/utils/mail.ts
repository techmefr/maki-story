import { logEvent } from '~~/server/utils/log'
import { mailText } from '~~/technical/Mail/server/utils/mailTexts'
import { renderMail } from '~~/technical/Mail/server/utils/mailTemplates'
import type { IMailRequest, IMailSite } from '~~/technical/Mail/server/utils/mailTemplates'

const SEND_TIMEOUT_MS = 4000
const BREVO_URL = 'https://api.brevo.com/v3/smtp/email'

export interface IMail {
    to: string
    subject: string
    text: string
    html?: string
}

export const isFakeDelivery = (): boolean => process.env.NOTIFY_PROVIDER === 'fake'

export const mailSite = (baseUrl?: string): IMailSite => ({
    baseUrl: (baseUrl ?? process.env.APP_BASE_URL ?? '').replace(/\/$/, ''),
    address: process.env.MAIL_POSTAL_ADDRESS ?? '',
    support: process.env.MAIL_SUPPORT ?? '',
})

export const renderLocalizedMail = (locale: string | null, request: IMailRequest, baseUrl?: string): Pick<IMail, 'subject' | 'text' | 'html'> => {
    const lang = locale ?? DEFAULT_LOCALE
    const rendered = renderMail(request, (key, params) => mailText(lang, key, params), mailSite(baseUrl), lang)
    return { subject: rendered.subject, text: rendered.text, html: rendered.html }
}

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
            body: JSON.stringify({
                sender: { email: sender, name: process.env.MAIL_FROM_NAME ?? 'Tantara' },
                to: [{ email: mail.to }],
                subject: mail.subject,
                textContent: mail.text,
                ...(mail.html ? { htmlContent: mail.html } : {}),
            }),
            signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
        })
        return response.ok
    } catch (_error) {
        logEvent('Envoi d’e-mail impossible')
        return false
    }
}

export const mailDeliveryReady = (): boolean => isFakeDelivery() || (Boolean(process.env.BREVO_API_KEY) && Boolean(process.env.MAIL_FROM))
