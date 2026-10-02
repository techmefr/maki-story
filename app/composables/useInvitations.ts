export const useInvitations = () => {
    const { request } = useApi()

    const list = (): Promise<IInvitation[]> => request<IInvitation[]>('/invitations')

    const create = (input: IInvitationInput): Promise<IInvitationCreated> => request<IInvitationCreated>('/invitations', { method: 'POST', body: input })

    const revoke = async (id: string): Promise<void> => {
        await request(`/invitations/${id}`, { method: 'DELETE' })
    }

    const preview = (code: string): Promise<IInvitationPreview> => request<IInvitationPreview>(`/invitations/preview/${encodeURIComponent(code)}`)

    return { list, create, revoke, preview }
}

export const invitationState = (invitation: IInvitation): 'used' | 'revoked' | 'expired' | 'pending' => {
    if (invitation.usedAt !== null) {
        return 'used'
    }
    if (invitation.revokedAt !== null) {
        return 'revoked'
    }
    return new Date(invitation.expiresAt).getTime() > Date.now() ? 'pending' : 'expired'
}
