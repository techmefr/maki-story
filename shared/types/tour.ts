export type TourStatus = 'none' | 'pending' | 'done'
export type TourAudience = 'parent' | 'relative'

export interface ITourState {
    status: TourStatus
    audience: TourAudience
}

export interface ITourUpdate {
    status: 'pending' | 'done'
}
