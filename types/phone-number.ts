export interface TrackingNumber {
    id: string;
    number: string;
    forwardingVoiceNumber?: string;
    marketingSource?: {
        id: string;
        name: string;
        description?: string;
        channel?: string;
        campaignName?: string;
    } | null,
    createdAt?: string | null;
    updatedAt?: string | null
}

export interface AvailableNumber {
    id?: string | null;
    phoneNumber: string;      // E.164
    friendlyName: string;    // e.g., "(415) 555-0123"

    locality: string;            // city
    region: string;              // state
    isoCountry: string;        // "US"

    lata?: string | null;
    rateCenter?: string | null;
    beta?: string | null;
    capabilities?: {
        voice: boolean,
        sms: boolean,
        mms: boolean
    } | null;
};