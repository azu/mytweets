export interface TweetAPIResponse {
    text: string;
    entities?: Entities;
    created_at?: string;
    id: string;
}

export interface Entities {
    annotations: Annotation[];
    urls: API_URL[];
}

export interface Annotation {
    start: number;
    end: number;
    probability: number;
    type: string;
    normalized_text: string;
}

export interface API_URL {
    start: number;
    end: number;
    url: string;
    expanded_url: string;
    display_url: string;
}

export interface SearchKeywordResponse {
    text: string;
    entities: Entities;
    created_at: Date;
    id: string;
}

export interface Entities {
    annotations: Annotation[];
    urls: API_URL[];
}

export interface Annotation {
    start: number;
    end: number;
    probability: number;
    type: string;
    normalized_text: string;
}

export interface API_URL {
    start: number;
    end: number;
    url: string;
    expanded_url: string;
    display_url: string;
}
