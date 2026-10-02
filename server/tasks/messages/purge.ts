import { getDb } from '../../utils/db'
import { purgeExpiredMessages } from '../../utils/messages'

export default defineTask({
    meta: { name: 'messages:purge', description: 'Expire listened voice messages and delete their audio' },
    async run() {
        return { result: await purgeExpiredMessages(getDb()) }
    },
})
