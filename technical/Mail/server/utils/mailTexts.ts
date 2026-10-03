import ar from '~/i18n/locales/ar/mail.json'
import de from '~/i18n/locales/de/mail.json'
import en from '~/i18n/locales/en/mail.json'
import es from '~/i18n/locales/es/mail.json'
import fr from '~/i18n/locales/fr/mail.json'
import it from '~/i18n/locales/it/mail.json'
import mg from '~/i18n/locales/mg/mail.json'
import pt from '~/i18n/locales/pt/mail.json'
import zh from '~/i18n/locales/zh/mail.json'
import templatesEn from '../i18n/en.json'
import templatesFr from '../i18n/fr.json'

type TTree = { [key: string]: string | TTree }

const CATALOGS: Record<string, TTree> = { ar, de, en: { ...en, ...templatesEn }, es, fr: { ...fr, ...templatesFr }, it, mg, pt, zh }

const lookup = (tree: TTree | undefined, key: string): string | null => {
    let node: string | TTree | undefined = tree
    for (const part of key.split('.')) {
        node = typeof node === 'object' ? node[part] : undefined
    }
    return typeof node === 'string' ? node : null
}

export const hasMailText = (locale: string | null, key: string): boolean => lookup(CATALOGS[locale ?? DEFAULT_LOCALE], key) !== null

export const mailText = (locale: string | null, key: string, params: Record<string, string | number> = {}): string => {
    const template = lookup(CATALOGS[locale ?? DEFAULT_LOCALE], key) ?? lookup(CATALOGS[DEFAULT_LOCALE], key) ?? key
    return template.replace(/\{(\w+)\}/g, (_match, name: string) => String(params[name] ?? ''))
}
