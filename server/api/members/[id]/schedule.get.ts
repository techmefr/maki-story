import { defaultWeekly } from '../../../../shared/utils/schedule'
import { getDb } from '../../../utils/db'
import { loadSchedule } from '../../../utils/parental'
import { requirePermission } from '../../../utils/permissions'
import { requireParam } from '../../../utils/validate'

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
