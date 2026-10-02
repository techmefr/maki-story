import type { Sql } from 'postgres'
import { notify } from './notifications'

export const BIRTHDAY_REMINDER_DAYS = 3

interface IUpcomingBirthday {
    id: string
    familyId: string
    name: string
    days: number
    year: number
}

export const sendBirthdayReminders = async (db: Sql): Promise<number> => {
    const upcoming = await db<IUpcomingBirthday[]>`
        select id, family_id, name, days, year from (
            select m.id, m.family_id, m.name,
                (next_birthday - current_date)::int as days, extract(year from next_birthday)::int as year
            from (
                select m.*, case when last_birthday = current_date then current_date else (last_birthday + interval '1 year')::date end as next_birthday
                from (
                    select members.*, (birth_date + make_interval(years => date_part('year', age(current_date, birth_date))::int))::date as last_birthday
                    from members where role = 'child' and birth_date is not null and deleted_at is null and status = 'active'
                ) m
            ) m
        ) upcoming where days between 1 and ${BIRTHDAY_REMINDER_DAYS}
    `
    let sent = 0
    for (const child of upcoming) {
        const groupKey = `birthday:${child.id}:${child.year}`
        const [known] = await db`select 1 from notifications where family_id = ${child.familyId} and group_key = ${groupKey} limit 1`
        if (known) {
            continue
        }
        const payload = { childId: child.id, childName: child.name, days: child.days }
        await notify(db, { familyId: child.familyId, recipientMemberId: null, kind: 'birthday_reminder', payload, groupKey })
        const relatives = await db<{ id: string }[]>`
            select m.id from members m
            where m.family_id = ${child.familyId} and m.role = 'relative' and m.deleted_at is null and m.status = 'active' and m.source_member_id is null
                and not exists (
                    select 1 from memberships ms
                    where ms.member_id = m.id and cardinality(ms.child_ids) > 0 and not (${child.id} = any (ms.child_ids))
                )
        `
        for (const relative of relatives) {
            await notify(db, { familyId: child.familyId, recipientMemberId: relative.id, kind: 'birthday_reminder', payload, groupKey })
        }
        sent += 1
    }
    return sent
}
