import type { Sql, TransactionSql } from 'postgres'
import { isValidBirthDate } from '../../shared/utils/age'
import { badRequest } from './validate'

export const memberExtras = (db: Sql | TransactionSql, actorRole: MemberRole, actorMemberId: string | null) => db`
    code_enabled,
    case when (${actorRole === 'parent'}::boolean or id = ${actorMemberId}::text) then birthday_celebrated_year end as birthday_celebrated_year,
    case when (${actorRole === 'parent'}::boolean or id = ${actorMemberId}::text) then birth_date::text end as birth_date,
    case when ${actorRole === 'parent'}::boolean then age_shift else 0 end as age_shift,
    case when birth_date is null then null else date_part('year', age(current_date, birth_date))::int end as age_years
`

export const readBirthDate = (value: unknown, role: MemberRole): string | null => {
    if (value === null || value === undefined || value === '') {
        return null
    }
    if (role !== 'child') {
        return badRequest('Only a child has a birth date')
    }
    return isValidBirthDate(value) ? value : badRequest('Invalid birth date')
}
