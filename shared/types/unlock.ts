export interface IProfileUnlocker {
    id: string
    label: string
    isAvailable: (memberId: string) => Promise<boolean>
    prove: (memberId: string) => Promise<IProfileProof | null>
}
