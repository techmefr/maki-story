import { getDb } from '../../utils/db'
import { sendDailyDigests } from '~~/functional/Notification/server/utils/digest'

export default defineTask({
    meta: { name: 'notifications:digest', description: 'Send one daily summary per adult account' },
    async run() {
        return { result: await sendDailyDigests(getDb()) }
    },
})
