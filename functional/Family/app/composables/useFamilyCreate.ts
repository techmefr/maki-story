export type TFamilyCreateStep = 'name' | 'firstName' | 'lastName' | 'displayName' | 'childName' | 'childAge' | 'childPhoto' | 'childCode' | 'parentCode' | 'done'
export type TFamilyCreateGroup = 'family' | 'you' | 'child' | 'parent'

export const FAMILY_CREATE_STEPS: TFamilyCreateStep[] = ['name', 'firstName', 'lastName', 'displayName', 'childName', 'childAge', 'childPhoto', 'childCode', 'parentCode', 'done']
export const FAMILY_CREATE_GROUPS: TFamilyCreateGroup[] = ['family', 'you', 'child', 'parent']

const STEP_GROUPS: Record<TFamilyCreateStep, TFamilyCreateGroup | null> = {
    name: 'family',
    firstName: 'you',
    lastName: 'you',
    displayName: 'you',
    childName: 'child',
    childAge: 'child',
    childPhoto: 'child',
    childCode: 'child',
    parentCode: 'parent',
    done: null,
}
export const MAX_CHILD_AGE = 17

export const useFamilyCreate = () => {
    const { request } = useApi()
    const { upload } = useFiles()
    const { load, children, update } = useMembers()
    const nuxtApp = useNuxtApp()

    const step = ref<TFamilyCreateStep>('name')
    const familyName = ref('')
    const firstName = ref('')
    const lastName = ref('')
    const displayName = ref('')
    const childName = ref('')
    const childAge = ref<number | null>(null)
    const childPhoto = ref<Blob | null>(null)
    const childCode = ref<IMemberCodeInput | null>(null)
    const parentCode = ref<IMemberCodeInput | null>(null)
    const isBusy = ref(false)
    const hasFailed = ref(false)

    const stepIndex = computed<number>(() => FAMILY_CREATE_STEPS.indexOf(step.value))

    const groupIndex = computed<number>(() => {
        const group = STEP_GROUPS[step.value]
        return group === null ? FAMILY_CREATE_GROUPS.length : FAMILY_CREATE_GROUPS.indexOf(group)
    })

    const canContinue = computed<boolean>(() => {
        if (step.value === 'name') {
            return familyName.value.trim() !== ''
        }
        if (step.value === 'firstName') {
            return firstName.value.trim() !== ''
        }
        if (step.value === 'childName') {
            return childName.value.trim() !== ''
        }
        if (step.value === 'childAge') {
            return childAge.value !== null
        }
        if (step.value === 'childCode') {
            return childCode.value !== null
        }
        if (step.value === 'parentCode') {
            return parentCode.value !== null
        }
        return true
    })

    const attachPhoto = async (): Promise<void> => {
        const photo = childPhoto.value
        if (!photo) {
            return
        }
        try {
            await load()
            const created = children.value.find(item => item.name === childName.value.trim())
            if (created) {
                await update(created.id, { photoFileId: await upload(photo, photo.type) })
            }
        } catch (_error) {
            hasFailed.value = true
        }
    }

    const submit = async (): Promise<boolean> => {
        if (childAge.value === null || childCode.value === null || parentCode.value === null) {
            return false
        }
        isBusy.value = true
        hasFailed.value = false
        try {
            const result = await request<IAuthState>('/family', {
                method: 'POST',
                body: {
                    familyName: familyName.value,
                    parent: { firstName: firstName.value, lastName: lastName.value, displayName: displayName.value },
                    parentCode: parentCode.value,
                    child: { name: childName.value, age: childAge.value, code: childCode.value },
                },
            })
            await nuxtApp.runWithContext(() => {
                clearNuxtState()
                useState<boolean | null>('session-state', () => null).value = result.isSignedIn
                useState<string | null>('current-member-id', () => null).value = result.memberId
            })
            await attachPhoto()
            return true
        } catch (_error) {
            hasFailed.value = true
            return false
        } finally {
            isBusy.value = false
        }
    }

    const back = (): void => {
        if (stepIndex.value === 0) {
            return
        }
        step.value = FAMILY_CREATE_STEPS[stepIndex.value - 1] as TFamilyCreateStep
    }

    const next = async (): Promise<void> => {
        if (!canContinue.value) {
            return
        }
        if (step.value === 'parentCode') {
            if (await submit()) {
                step.value = 'done'
            }
            return
        }
        step.value = FAMILY_CREATE_STEPS[stepIndex.value + 1] as TFamilyCreateStep
    }

    return { step, stepIndex, groupIndex, familyName, firstName, lastName, displayName, childName, childAge, childPhoto, childCode, parentCode, isBusy, hasFailed, canContinue, back, next }
}
