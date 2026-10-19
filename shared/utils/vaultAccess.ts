export const canAccessVault = (actorRole: string, actorId: string | null, ownerRole: string, ownerId: string): boolean =>
    actorId === ownerId || (actorRole === 'parent' && ownerRole === 'child')
