export interface IDeviceProof {
    id: string
    secret: string
}

export interface IDeviceEnrolment extends IDeviceProof {
    label: string
}

export interface IDevice {
    id: string
    memberId: string
    memberName: string
    label: string
    isPersonal: boolean
    createdAt: string
    lastUsedAt: string | null
}

export interface IPersonalDevice extends IDeviceProof {
    memberId: string
}
