import ar from '../../app/i18n/locales/ar/mail.json'
import de from '../../app/i18n/locales/de/mail.json'
import en from '../../app/i18n/locales/en/mail.json'
import es from '../../app/i18n/locales/es/mail.json'
import fr from '../../app/i18n/locales/fr/mail.json'
import it from '../../app/i18n/locales/it/mail.json'
import mg from '../../app/i18n/locales/mg/mail.json'
import pt from '../../app/i18n/locales/pt/mail.json'
import zh from '../../app/i18n/locales/zh/mail.json'

type TTree = { [key: string]: string | TTree }

const CATALOGS: Record<string, TTree> = { ar, de, en, es, fr, it, mg, pt, zh }

const lookup = (tree: TTree | undefined, key: string): string | null => {
    let node: string | TTree | undefined = tree
    for (const part of key.split('.')) {
        node = typeof node === 'object' ? node[part] : undefined
    }
    return typeof node === 'string' ? node : null
}

export const mailText = (locale: string | null, key: string, params: Record<string, string | number> = {}): string => {
    const template = lookup(CATALOGS[locale ?? DEFAULT_LOCALE], key) ?? lookup(CATALOGS[DEFAULT_LOCALE], key) ?? key
    return template.replace(/\{(\w+)\}/g, (_match, name: string) => String(params[name] ?? ''))
}
