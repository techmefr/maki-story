import { getDb } from '../../utils/db'
import { purgeTrash } from '../../utils/trash'

export default defineTask({
    meta: { name: 'trash:purge', description: 'Delete trashed items after the restore window and apply log retention' },
    async run() {
        return { result: await purgeTrash(getDb()) }
    },
})
