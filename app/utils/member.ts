export const memberHex = (member: IMember | null): string => {
    return member ? getVoiceColor(member.color).hex : '#FFFFFF'
}

export const memberHexLight = (member: IMember | null): string => {
    return member ? getVoiceColor(member.color).hexLight : '#FFFFFF'
}

export const roleLabel = (role: MemberRole): string => {
    const labels: Record<MemberRole, string> = {
        parent: 'Parent',
        relative: 'Proche',
        child: 'Enfant',
    }
    return labels[role]
}
