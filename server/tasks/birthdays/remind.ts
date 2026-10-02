import { getDb } from '../../utils/db'
import { sendBirthdayReminders } from '../../utils/birthdays'

export default defineTask({
    meta: { name: 'birthdays:remind', description: 'Remind parents and relatives of upcoming child birthdays' },
    async run() {
        return { result: await sendBirthdayReminders(getDb()) }
    },
})
