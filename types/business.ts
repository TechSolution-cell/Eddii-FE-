export interface Business {
    id: string;
    email: string;
    businessName: string;
    maxTrackingNumbers: number;
    trackingNumbersUsedCount: number;
    // accountRole: AccountRole;

    createdAt?: string;
    updatedAt?: string;
}