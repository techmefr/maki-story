export type TagIconId =
    | 'hat'
    | 'waves'
    | 'tree'
    | 'star'
    | 'crown'
    | 'paw'
    | 'moon'
    | 'heart'
    | 'smile'
    | 'compass'
    | 'question'
    | 'book'
    | 'sun'
    | 'flag'

export interface ITag {
    slug: string
    color: VoiceColorId
    icon: TagIconId
    names: Record<string, string>
    keywords: string[]
    bookCount: number
}

export interface ITagInput {
    names: Record<string, string>
    color: VoiceColorId
    icon: TagIconId
}

export interface IDefaultTag {
    slug: string
    color: VoiceColorId
    icon: TagIconId
    names: Record<string, string>
    keywords: string[]
}

export interface IBookTagsBody {
    tags: string[]
    autoTags?: string[]
}

export type TagProblem = 'name-required' | 'slug-empty' | 'slug-taken' | 'color-invalid' | 'icon-invalid' | 'language-invalid' | 'name-too-long'
