import postgres from 'postgres'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildMigrations, migrateUp } from '../server/utils/migrator.ts'
import { DEMO_FAMILY, DEMO_PROFILES, isLocalDemo } from '../shared/utils/demo.ts'
import { hashPassword } from '../technical/Auth/server/utils/password.ts'

const url = process.env.DATABASE_URL
if (!isLocalDemo(process.env.NODE_ENV !== 'production' && !process.env.VERCEL, process.env.DEMO_MODE, url, 'localhost')) {
    throw new Error('Demo seeding requires DEMO_MODE=true and a local database named maki_demo, outside production')
}
const db = postgres(url!, { max: 1, onnotice: () => undefined })
try {
    const directory = join(import.meta.dirname, '../server/migrations')
    const sources = Object.fromEntries(readdirSync(directory).map(file => [file, readFileSync(join(directory, file), 'utf8')]))
    await migrateUp(db, buildMigrations(sources))
    const password = await hashPassword('Maki-Demo-Local-2026!')
    const audio = Buffer.alloc(44 + 16000)
    audio.write('RIFF', 0); audio.writeUInt32LE(audio.length - 8, 4); audio.write('WAVEfmt ', 8)
    audio.writeUInt32LE(16, 16); audio.writeUInt16LE(1, 20); audio.writeUInt16LE(1, 22)
    audio.writeUInt32LE(8000, 24); audio.writeUInt32LE(16000, 28); audio.writeUInt16LE(2, 32)
    audio.writeUInt16LE(16, 34); audio.write('data', 36); audio.writeUInt32LE(16000, 40)
    for (let sample = 0; sample < 8000; sample++) audio.writeInt16LE(Math.round(Math.sin(sample / 8000 * Math.PI * 440 * 2) * 1800 * Math.sin(Math.PI * sample / 8000)), 44 + sample * 2)
    await db.begin(async tx => {
        await tx`insert into families (id, name, invite_code) values (${DEMO_FAMILY}, 'La famille Maki · démo', 'MAKIDEMO') on conflict (id) do nothing`
        for (const profile of DEMO_PROFILES) {
            await tx`insert into accounts (id, email, password_hash) values (${profile.accountId}, ${profile.email}, ${password}) on conflict (id) do nothing`
            if (profile.role === 'parent') {
                await tx`insert into account_families (account_id, family_id) values (${profile.accountId}, ${DEMO_FAMILY}) on conflict do nothing`
            }
            await tx`insert into members (id, family_id, name, role, color, spoken_languages, code_enabled)
                values (${profile.id}, ${DEMO_FAMILY}, ${profile.name}, ${profile.role}, ${profile.role === 'child' ? 'sky' : 'sun'}, array['fr','mg'], false) on conflict (id) do nothing`
        }
        await tx`delete from account_families where account_id = 'maki-demo-relative' and family_id = ${DEMO_FAMILY}`
        for (const profile of [DEMO_PROFILES[0], DEMO_PROFILES[4]]) {
            await tx`insert into memberships (account_id, family_id, role, member_id) values (${profile.accountId}, ${DEMO_FAMILY}, ${profile.role}, ${profile.id}) on conflict do nothing`
        }
        await tx`insert into files (id, family_id, mime, data, created_by_member_id) values ('maki-demo-audio', ${DEMO_FAMILY}, 'audio/wav', ${audio}, 'maki-demo-maman') on conflict (id) do nothing`
        for (const language of ['fr', 'mg']) {
            const book = 'maki-demo-book-' + language
            const title = language === 'fr' ? 'Le grand voyage de Maki à travers la forêt enchantée' : 'Ny dian’i Maki'
            await tx`insert into books (id, family_id, title, status, language, voice_languages, cover_url)
                values (${book}, ${DEMO_FAMILY}, ${title}, 'ready', ${language}, ${[language]}, '/art/child/storybook-world.jpg') on conflict (id) do nothing`
            for (const position of [0, 1]) {
                const line = book + '-line-' + position
                const take = line + '-take'
                await tx`insert into book_pages (id, family_id, book_id, position, title, is_silent) values (${book + '-page-' + position}, ${DEMO_FAMILY}, ${book}, ${position}, ${'Page ' + (position + 1)}, false) on conflict (id) do nothing`
                await tx`insert into lines (id, family_id, book_id, position, page_index, text, character) values (${line}, ${DEMO_FAMILY}, ${book}, ${position}, ${position}, 'Son de démonstration', 'Narrateur') on conflict (id) do nothing`
                await tx`insert into recordings (id, family_id, line_id, member_id, language, file_id, duration_ms, mime, status) values (${take}, ${DEMO_FAMILY}, ${line}, 'maki-demo-maman', ${language}, 'maki-demo-audio', 1000, 'audio/wav', 'approved') on conflict (id) do nothing`
                await tx`insert into approved_takes (id, family_id, line_id, member_id, language, file_id, duration_ms, mime) values (${take}, ${DEMO_FAMILY}, ${line}, 'maki-demo-maman', ${language}, 'maki-demo-audio', 1000, 'audio/wav') on conflict do nothing`
            }
        }
        for (const child of DEMO_PROFILES.filter(profile => profile.role === 'child')) {
            for (const from of [DEMO_PROFILES[0], DEMO_PROFILES[4]]) {
                const message = child.id + '-' + from.id
                await tx`insert into messages (id, family_id, from_member_id, to_member_id, file_id, mime, duration_ms) values (${message}, ${DEMO_FAMILY}, ${from.id}, ${child.id}, 'maki-demo-audio', 'audio/wav', 1000) on conflict (id) do nothing`
                await tx`insert into treasures (id, family_id, child_id, source_message_id, from_member_id, file_id, mime, saved_by_member_id) values (${message + '-treasure'}, ${DEMO_FAMILY}, ${child.id}, ${message}, ${from.id}, 'maki-demo-audio', 'audio/wav', ${child.id}) on conflict do nothing`
            }
        }
    })
    process.stdout.write('Demo ready: 5 profiles, 2 books (fr/mg), messages and treasures. Run again without duplicating data.\n')
} finally {
    await db.end()
}
