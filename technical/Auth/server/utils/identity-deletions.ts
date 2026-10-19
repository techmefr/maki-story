import type { Sql } from 'postgres'
import { processIdentityDeletions } from './identity-deletion-queue'
import { deleteSupabaseIdentity } from './supabase'

export const purgeSupabaseIdentities = (db: Sql) => processIdentityDeletions(db, deleteSupabaseIdentity)
