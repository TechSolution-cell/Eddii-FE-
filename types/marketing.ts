export interface MarketingSource {
    id: string | undefined;
    name: string;
    description?: string | null;
    channel?: string | null;
    campaignName?: string | null;
    createdAt?: string;
    updatedAt?: string;
};