export const isVoiceBlocked = (status: MemberStatus, policy: VoicePolicy): boolean => {
    return status === 'blocked' || ((status === 'left' || status === 'deceased') && policy !== 'keep')
}
