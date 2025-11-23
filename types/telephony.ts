export interface CallLog {
    id: number;
    callerNumber: string;
    receiverNumber: string;
    status: CallStatus;
    callStartedAt: Date;
    durationSeconds: number;
    transcription?: string | null;
    trackingNumber?: string | null;

    marketingSource: {
        id: string
        name: string;
        description: string;
        channel?: string | null;
        campaignName?: string | null;
    },
}

export const CallStatus = {
    Queued: 'queued',
    Ringing: 'ringing',
    InProgress: 'in-progress',
    Completed: 'completed',
    Busy: 'busy',
    Failed: 'failed',
    NoAnswer: 'no-answer',
    Canceled: 'canceled',
    Unknown: 'unknown',
} as const;

export type CallStatus = typeof CallStatus[keyof typeof CallStatus];