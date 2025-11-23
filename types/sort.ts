export type CallLogSortBy = 'callStartedAt';

export type MarketingSourceSortBy = 'createdAt' | 'updatedAt' | 'name' | 'channel' | 'campaignName';

export type BusinessSortBy = 'createdAt' | 'updatedAt' | 'name';

export type TrackingNumberSortBy = 'createdAt' | 'updatedAt';

export type SortOrder = 'ASC' | 'DESC';


// export const isSortOrder = (v: unknown): v is SortOrder =>
//   v === 'ASC' || v === 'DESC';

// export const normalizeSortOrder = (v: string): SortOrder =>
//   v.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
