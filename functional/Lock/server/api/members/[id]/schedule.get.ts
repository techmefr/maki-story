import { defaultWeekly } from '~~/shared/utils/schedule'
import { getDb } from '~~/server/utils/db'
import { loadSchedule } from '~~/server/utils/parental'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<IChildSchedule> => {
    const actor = await requirePermission(event, 'members.schedule.manage')
    const schedule = await loadSchedule(getDb(), actor.familyId, requireParam(event, 'id'))
    return {
        isEnabled: schedule?.isEnabled ?? false,
        weekly: schedule && schedule.weekly.length === 7 ? schedule.weekly : defaultWeekly(),
        timezone: schedule?.timezone ?? 'UTC',
        isManualBlock: schedule?.isManualBlock ?? false,
        manualUntil: schedule?.manualUntil ?? null,
    }
})
