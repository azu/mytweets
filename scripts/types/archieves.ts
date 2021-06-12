export interface SearchKeywordResponse {
    tweet: ArchiveTweet;
}

export interface ArchiveTweet {
    retweeted: boolean;
    source: string;
    entities: Entities;
    display_text_range: string[];
    favorite_count: string;
    id_str: string;
    truncated: boolean;
    retweet_count: string;
    id: string;
    created_at: string;
    favorited: boolean;
    full_text: string;
    lang: Lang;
    possibly_sensitive?: boolean;
    in_reply_to_status_id_str?: string;
    in_reply_to_user_id?: string;
    in_reply_to_status_id?: string;
    in_reply_to_screen_name?: string;
    in_reply_to_user_id_str?: string;
    extended_entities?: ExtendedEntities;
}

export interface Entities {
    hashtags: Hashtag[];
    symbols: any[];
    user_mentions: UserMention[];
    urls: ArchivesURL[];
    media?: Media[];
}

export interface Hashtag {
    text: string;
    indices: string[];
}

export interface Media {
    expanded_url: string;
    indices: string[];
    url: string;
    media_url: string;
    id_str: string;
    id: string;
    media_url_https: string;
    sizes: Sizes;
    type: string;
    display_url: string;
}

export interface Sizes {
    small: Large;
    thumb: Large;
    medium: Large;
    large: Large;
}

export interface Large {
    w: string;
    h: string;
    resize: Resize;
}

export enum Resize {
    Crop = "crop",
    Fit = "fit"
}

export interface ArchivesURL {
    url: string;
    expanded_url: string;
    display_url: string;
    indices: [start: string, end: string];
}

export interface UserMention {
    name: string;
    screen_name: string;
    indices: string[];
    id_str: string;
    id: string;
}

export interface ExtendedEntities {
    media: Media[];
}

export type Lang = string;
