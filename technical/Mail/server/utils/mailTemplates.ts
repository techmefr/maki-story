export type MailTemplateId =
    | 'magic_link'
    | 'invitation'
    | 'code_reset'
    | 'welcome'
    | 'review_request'
    | 'corrections'
    | 'new_voice'
    | 'export_ready'
    | 'account_deleted'
    | 'digest'

export type MailParams = Record<string, string | number>
export type MailTranslate = (key: string, params?: MailParams) => string

export interface IMailLines {
    color: string
    glyph: string
    text: string
    badge: string
}

export interface IMailSite {
    baseUrl: string
    address: string
    support: string
}

export interface IMailRequest {
    template: MailTemplateId
    params: MailParams
    lines?: IMailLines[]
}

export interface IRenderedMail {
    subject: string
    html: string
    text: string
}

interface ITemplateSpec {
    color: string
    glyph: string
    paragraphs: string[]
    hasButton: boolean
    hasNote: boolean
    hasManage: boolean
    hasLines?: boolean
    rules?: Record<string, { param: string; whenEmpty: string | null }>
}

const INK = '#1E1A3F'
const SOFT_INK = '#4a4478'
const PAGE = '#FFF3DC'
const CARD = '#FFFBF2'
const YELLOW = '#FFC933'
const FONT = "'Trebuchet MS',Verdana,Arial,sans-serif"
const FILLER = '&nbsp;&zwnj;'.repeat(5)

export const MAIL_KIND_STYLE: Record<string, { color: string; glyph: string }> = {
    message_received: { color: '#FF8FC9', glyph: '&#9835;' },
    voice_batch: { color: '#FF8FC9', glyph: '&#9835;' },
    recording_batch: { color: '#B28DFF', glyph: '&#9654;' },
    share_to_approve: { color: '#B28DFF', glyph: '&#9654;' },
    review_result: { color: '#FF7766', glyph: '!' },
    stale_takes: { color: '#FF7766', glyph: '!' },
    share_received: { color: '#6DB5FF', glyph: '&#9733;' },
    recording_request: { color: '#6DB5FF', glyph: '&#9733;' },
    birthday_reminder: { color: '#4AD3A5', glyph: '&#9829;' },
}

export const MAIL_DEFAULT_KIND_STYLE = { color: YELLOW, glyph: '&#9733;' }

const SPECS: Record<MailTemplateId, ITemplateSpec> = {
    magic_link: { color: '#4AD3A5', glyph: '&#10003;', paragraphs: ['p1', 'p2'], hasButton: true, hasNote: true, hasManage: false },
    invitation: { color: '#FF8FC9', glyph: '{initial}', paragraphs: ['p1', 'p2'], hasButton: true, hasNote: true, hasManage: false },
    code_reset: { color: '#6DB5FF', glyph: '&#8226;&#8226;&#8226;', paragraphs: ['p1', 'p2'], hasButton: true, hasNote: true, hasManage: false },
    welcome: { color: YELLOW, glyph: '&#9829;', paragraphs: ['p1', 'p2'], hasButton: true, hasNote: false, hasManage: false },
    review_request: { color: '#B28DFF', glyph: '&#9654;', paragraphs: ['p1', 'p2'], hasButton: true, hasNote: false, hasManage: true },
    corrections: { color: '#FF7766', glyph: '!', paragraphs: ['p1', 'p2'], hasButton: true, hasNote: false, hasManage: true, rules: { p2: { param: 'comment', whenEmpty: null } } },
    new_voice: { color: '#FF8FC9', glyph: '&#9835;', paragraphs: ['p1', 'p2'], hasButton: true, hasNote: false, hasManage: true, rules: { p1: { param: 'n', whenEmpty: 'p1Plain' } } },
    export_ready: { color: '#CFE5FF', glyph: '&#8681;', paragraphs: ['p1'], hasButton: true, hasNote: true, hasManage: false },
    account_deleted: { color: '#E5E3F0', glyph: '&#10005;', paragraphs: ['p1', 'p2'], hasButton: false, hasNote: true, hasManage: false, rules: { note: { param: 'support', whenEmpty: 'noteNoContact' } } },
    digest: { color: YELLOW, glyph: '&#9733;', paragraphs: ['p1'], hasButton: true, hasNote: false, hasManage: true, hasLines: true },
}

export const escapeHtml = (value: string): string =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

export const escapeMarkup = (value: string): string => escapeHtml(value).replace(/\*/g, '&#42;').replace(/\[/g, '&#91;').replace(/\]/g, '&#93;')

const singleLine = (value: string): string => value.replace(/[\r\n]+/g, ' ').trim()

const escapeParams = (params: MailParams): MailParams => Object.fromEntries(Object.entries(params).map(([key, value]) => [key, escapeMarkup(String(value))]))

const pill = (text: string): string =>
    `<span style="display:inline-block;background-color:${YELLOW};border:2px solid ${INK};border-radius:999px;padding:2px 12px;font-weight:bold;font-size:15px">${text}</span>`

const markup = (value: string): string => value.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\[\[(.+?)\]\]/g, (_match, inner: string) => pill(inner))

const plain = (value: string): string => value.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[\[(.+?)\]\]/g, '$1')

const row = (style: string, content: string, className = ''): string => `<tr><td${className ? ` class="${className}"` : ''} style="${style}">${content}</td></tr>`

const TEXT_STYLE = `padding:0 32px 16px;font-family:${FONT};font-size:18px;line-height:26px;color:${INK};`
const NOTE_STYLE = `${TEXT_STYLE}font-size:15px;line-height:22px;padding-bottom:28px;color:${SOFT_INK}`

const linkTo = (site: IMailSite, path: string): string => `${site.baseUrl.replace(/\/$/, '')}${path}`

const logoRow = (): string =>
    `<tr><td align="center" style="padding:0 0 20px"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="56" height="56" align="center" valign="middle" bgcolor="${YELLOW}" style="width:56px;height:56px;background-color:${YELLOW};border:3px solid ${INK};border-radius:16px;font-family:${FONT};font-size:30px;font-weight:bold;color:${INK}">T</td><td style="padding-left:12px;font-family:${FONT};font-size:30px;font-weight:bold;color:${INK}">Tantara</td></tr></table></td></tr>`

const bannerRow = (color: string, glyph: string): string =>
    `<tr><td bgcolor="${color}" align="center" style="background-color:${color};border-radius:26px 26px 0 0;border-bottom:3px solid ${INK};padding:30px 20px"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="84" height="84" align="center" valign="middle" bgcolor="${CARD}" style="width:84px;height:84px;background-color:${CARD};border:3px solid ${INK};border-radius:42px;font-family:${FONT};font-size:42px;font-weight:bold;color:${INK}">${glyph}</td></tr></table></td></tr>`

const buttonRow = (label: string, url: string): string =>
    `<tr><td class="pad" style="padding:8px 32px 28px"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto"><tr><td bgcolor="${YELLOW}" style="background-color:${YELLOW};border:3px solid ${INK};border-bottom-width:6px;border-radius:22px;mso-padding-alt:16px 30px"><a href="${escapeHtml(url)}" style="display:block;padding:16px 30px;font-family:${FONT};font-size:20px;line-height:24px;font-weight:bold;color:${INK};text-decoration:none">${label}</a></td></tr></table></td></tr>`

const linesRows = (lines: IMailLines[]): string =>
    lines
        .map(
            line =>
                `<tr><td style="padding:0 32px 14px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;border:3px solid ${INK};border-radius:20px"><tr><td width="64" align="center" valign="middle" style="padding:12px 0 12px 12px"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="44" height="44" align="center" valign="middle" bgcolor="${line.color}" style="width:44px;height:44px;background-color:${line.color};border:3px solid ${INK};border-radius:22px;font-family:${FONT};font-size:22px;font-weight:bold;color:${INK}">${line.glyph}</td></tr></table></td><td valign="middle" style="padding:12px 14px;font-family:${FONT};font-size:17px;line-height:24px;color:${INK}">${escapeMarkup(line.text)}${line.badge ? ` ${pill(escapeMarkup(line.badge))}` : ''}</td></tr></table></td></tr>`,
        )
        .join('')

const footerRow = (reason: string, links: { help: string; legal: string; manage: string | null }, labels: { help: string; legal: string; manage: string }, address: string): string => {
    const anchors = [`<a href="${links.help}" style="color:${INK};font-weight:bold">${labels.help}</a>`, `<a href="${links.legal}" style="color:${INK};font-weight:bold">${labels.legal}</a>`]
    if (links.manage) {
        anchors.push(`<a href="${links.manage}" style="color:${INK};font-weight:bold">${labels.manage}</a>`)
    }
    const identity = address === '' ? 'Tantara' : `Tantara · ${address}`
    return `<tr><td align="center" style="padding:22px 20px 0;font-family:${FONT};font-size:13px;line-height:20px;color:${SOFT_INK}">${reason}<br>${identity}<br>${anchors.join(' · ')}</td></tr>`
}

const textLink = (label: string, url: string): string => `${label}: ${url}`

export const renderMail = (request: IMailRequest, translate: MailTranslate, site: IMailSite, lang: string): IRenderedMail => {
    const spec = SPECS[request.template]
    const prefix = `tpl.${request.template}`
    const params: MailParams = { support: site.support, ...request.params }
    const raw = Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)]))
    const safe = escapeParams(params)
    const resolve = (key: string): string | null => {
        const rule = spec.rules?.[key]
        return rule && String(params[rule.param] ?? '').trim() === '' ? rule.whenEmpty : key
    }
    const has = (key: string): boolean => translate(`${prefix}.${key}`, raw) !== `${prefix}.${key}`
    const html = (key: string): string => markup(translate(`${prefix}.${resolve(key) ?? key}`, safe))
    const text = (key: string): string => plain(translate(`${prefix}.${resolve(key) ?? key}`, raw))
    const url = String(params.url ?? linkTo(site, '/home'))
    const subject = singleLine(translate(`${prefix}.subject`, raw))
    const preheader = escapeHtml(singleLine(translate(`${prefix}.preheader`, raw)))
    const color = spec.color
    const glyph = spec.glyph === '{initial}' ? escapeHtml(String(params.initial ?? '').slice(0, 1) || 'T') : spec.glyph
    const paragraphs = spec.paragraphs.filter(key => resolve(key) !== null && has(resolve(key) ?? key))
    const hasNote = spec.hasNote && resolve('note') !== null && has(resolve('note') ?? 'note')
    const lines = request.lines ?? []
    const manageUrl = spec.hasManage ? linkTo(site, '/notifications/settings') : null
    const reasonKey = has('reason') ? `${prefix}.reason` : 'tpl.common.reason'
    const labels = { help: translate('tpl.common.help'), legal: translate('tpl.common.legal'), manage: translate('tpl.common.manage') }

    const rows: string[] = [bannerRow(color, glyph), row(`padding:28px 32px 14px;font-family:${FONT};font-size:30px;line-height:36px;font-weight:bold;color:${INK};mso-line-height-rule:exactly`, html('title'), 'pad')]
    for (const key of paragraphs) {
        rows.push(row(TEXT_STYLE, html(key)))
    }
    if (spec.hasLines) {
        rows.push(linesRows(lines))
    }
    if (spec.hasButton) {
        rows.push(buttonRow(html('button'), url))
    }
    if (hasNote) {
        rows.push(row(NOTE_STYLE, html('note')))
    }
    if (!spec.hasButton && !hasNote) {
        rows.push(row('padding:0 0 12px', ''))
    }

    const footer = footerRow(
        markup(translate(reasonKey, safe)),
        { help: linkTo(site, '/help'), legal: linkTo(site, '/legal'), manage: manageUrl },
        { help: escapeHtml(labels.help), legal: escapeHtml(labels.legal), manage: escapeHtml(labels.manage) },
        escapeHtml(site.address),
    )

    const document = `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${escapeHtml(subject)}</title>
<style>@media (max-width:620px){.w{width:100%!important}.pad{padding-left:18px!important;padding-right:18px!important}}</style></head>
<body style="margin:0;padding:0;background-color:${PAGE}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${PAGE}">${preheader}${FILLER}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAGE}" style="background-color:${PAGE}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" class="w" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px">
${logoRow()}
<tr><td bgcolor="${CARD}" style="background-color:${CARD};border:3px solid ${INK};border-bottom-width:7px;border-radius:30px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${rows.join('\n')}
</table></td></tr>
${footer}
</table></td></tr></table></body></html>`

    const plainParts: string[] = [plain(translate(`${prefix}.title`, raw)), '']
    for (const key of paragraphs) {
        plainParts.push(text(key))
    }
    for (const line of lines) {
        plainParts.push(`- ${line.text}${line.badge ? ` (${line.badge})` : ''}`)
    }
    if (spec.hasButton) {
        plainParts.push('', textLink(text('button'), url))
    }
    if (hasNote) {
        plainParts.push('', text('note'))
    }
    plainParts.push('', plain(translate(reasonKey, raw)), site.address === '' ? 'Tantara' : `Tantara · ${site.address}`)
    plainParts.push(textLink(labels.help, linkTo(site, '/help')), textLink(labels.legal, linkTo(site, '/legal')))
    if (manageUrl) {
        plainParts.push(textLink(labels.manage, manageUrl))
    }

    return { subject, html: document, text: plainParts.join('\n') }
}
