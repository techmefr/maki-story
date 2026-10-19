import { getDb } from '../../utils/db'
import { purgeSupabaseIdentities } from '~~/technical/Auth/server/utils/identity-deletions'

export default defineTask({
    meta: { name: 'auth:purge', description: 'Remove identities belonging to deleted accounts' },
    async run() {
        return { result: await purgeSupabaseIdentities(getDb()) }
    },
})
