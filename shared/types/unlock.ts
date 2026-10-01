export interface IProfileUnlocker {
    id: string
    label: string
    isAvailable: () => Promise<boolean>
    prove: (memberId: string) => Promise<IProfileProof | null>
}
