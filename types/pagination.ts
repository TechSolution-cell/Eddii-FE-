export type PageMeta = {
    total: number;
    page: number;
    limit: number;
    pageCount: number;
    hasNext: boolean;
    hasPrev: boolean;
};

export type Paginated<T> = {
    items: T[];
    meta: PageMeta
};