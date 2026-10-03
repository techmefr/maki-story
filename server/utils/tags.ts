import type { Sql, TransactionSql } from 'postgres'
import { getDb } from './db'
import { badRequest } from './validate'

type Db = Sql | TransactionSql

interface ITagRow {
    id: string
    slug: string
    color: VoiceColorId
    icon: TagIconId
    keywords: string[]
    bookCount: number
}

interface ITranslationRow {
    tagId: string
    language: string
    name: string
}

export const ensureDefaultTags = async (familyId: string): Promise<void> => {
    const db = getDb()
    await db.begin(async tx => {
        const claimed = await tx`
            update families set tags_seeded_at = now() where id = ${familyId} and tags_seeded_at is null returning id
        `
        if (claimed.length === 0) {
            return
        }
        for (const tag of DEFAULT_TAGS) {
            const [row] = await tx<{ id: string }[]>`
                insert into tags (family_id, slug, color, icon, keywords)
                values (${familyId}, ${tag.slug}, ${tag.color}, ${tag.icon}, ${tag.keywords})
                on conflict (family_id, slug) do nothing
                returning id
            `
            if (!row) {
                continue
            }
            for (const [language, name] of Object.entries(tag.names)) {
                await tx`
                    insert into tag_translations (tag_id, family_id, language, name) values (${row.id}, ${familyId}, ${language}, ${name})
                `
            }
        }
    })
}

export const listTags = async (familyId: string): Promise<ITag[]> => {
    const db = getDb()
    const rows = await db<ITagRow[]>`
        select t.id, t.slug, t.color, t.icon, t.keywords,
            (select count(*)::int from book_tags bt join books b on b.id = bt.book_id
                where bt.family_id = t.family_id and bt.slug = t.slug and b.deleted_at is null) as book_count
        from tags t where t.family_id = ${familyId} order by t.created_at, t.slug
    `
    const translations = await db<ITranslationRow[]>`
        select tag_id, language, name from tag_translations where family_id = ${familyId}
    `
    return rows.map(row => {
        const names: Record<string, string> = {}
        translations.filter(item => item.tagId === row.id).forEach(item => (names[item.language] = item.name))
        return { slug: row.slug, color: row.color, icon: row.icon, keywords: row.keywords, names, bookCount: row.bookCount }
    })
}

export const writeTagNames = async (tx: TransactionSql, tagId: string, familyId: string, names: Record<string, string>): Promise<void> => {
    await tx`delete from tag_translations where tag_id = ${tagId}`
    for (const [language, name] of Object.entries(names)) {
        await tx`insert into tag_translations (tag_id, family_id, language, name) values (${tagId}, ${familyId}, ${language}, ${name})`
    }
}

export const readBookTagBody = (value: unknown): IBookTagsBody => {
    const body = (value ?? {}) as Partial<IBookTagsBody>
    const isSlugList = (list: unknown): list is string[] => Array.isArray(list) && list.every(item => typeof item === 'string')
    if (!isSlugList(body.tags) || (body.autoTags !== undefined && !isSlugList(body.autoTags))) {
        return badRequest('Invalid tags')
    }
    const tags = [...new Set(body.tags)]
    if (tags.length > MAX_BOOK_TAGS) {
        return badRequest('Too many tags')
    }
    return { tags, autoTags: [...new Set(body.autoTags ?? [])].filter(slug => tags.includes(slug)) }
}

export const setBookTags = async (db: Db, familyId: string, bookId: string, body: IBookTagsBody): Promise<void> => {
    if (body.tags.length > 0) {
        const known = await db<{ slug: string }[]>`select slug from tags where family_id = ${familyId} and slug in ${db(body.tags)}`
        if (known.length !== body.tags.length) {
            badRequest('Unknown tag')
        }
    }
    await db`delete from book_tags where book_id = ${bookId} and family_id = ${familyId}`
    for (const slug of body.tags) {
        await db`
            insert into book_tags (book_id, family_id, slug, is_auto) values (${bookId}, ${familyId}, ${slug}, ${(body.autoTags ?? []).includes(slug)})
        `
    }
}
