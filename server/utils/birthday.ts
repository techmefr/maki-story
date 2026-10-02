import type { Sql, TransactionSql } from 'postgres'
import { BIRTHDAY_REMINDER_DAYS, daysUntilBirthday } from '../../shared/utils/age'

type Db = Sql | TransactionSql

interface IChildBirthday {
    id: string
    name: string
    birthDate: string
    timezone: string
}

export const ensureBirthdayReminders = async (db: Db, familyId: string): Promise<void> => {
    const children = await db<IChildBirthday[]>`
        select m.id, m.name, m.birth_date::text as birth_date, coalesce(s.timezone, 'UTC') as timezone
        from members m left join child_schedules s on s.member_id = m.id
        where m.family_id = ${familyId} and m.role = 'child' and m.deleted_at is null and m.status = 'active' and m.birth_date is not null
    `
    const due = children.map(child => ({ child, days: daysUntilBirthday(child.birthDate, child.timezone) })).filter(item => item.days <= BIRTHDAY_REMINDER_DAYS)
    if (due.length === 0) {
        return
    }
    const recipients = await db<{ id: string }[]>`
        select id from members
        where family_id = ${familyId} and role in ('parent', 'relative') and deleted_at is null and status = 'active' and source_member_id is null
    `
    const year = new Date().getUTCFullYear()
    for (const { child, days } of due) {
        const groupKey = `birthday:${child.id}:${year}`
        for (const recipient of recipients) {
            await db`
                insert into notifications (family_id, recipient_member_id, kind, payload, group_key)
                select ${familyId}, ${recipient.id}, 'birthday_reminder', ${db.json({ childName: child.name, days })}, ${groupKey}
                where not exists (select 1 from notifications where family_id = ${familyId} and recipient_member_id = ${recipient.id} and group_key = ${groupKey})
            `
        }
    }
}
