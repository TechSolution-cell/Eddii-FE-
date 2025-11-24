import { MarketingSource } from "./marketing";

export interface CallLog {
    id: string;
    callerNumber: string;
    receiverNumber: string;
    status: CallStatus;
    callStartedAt: Date;

    durationSeconds: number;
    intent: CallIntent;
    result: CallResult;
    sentiment: number | null;

    transcriptJson: Omit<TranscriptionSummary, 'fullText'> | null;
    recordingUrl: string | null;

    trackingNumber: string | null;

    marketingSource?: MarketingSource | null;
}

export interface TranscriptionSummary {
    turns: Turn[];
    fullText?: string;
    language?: string | null;
    durationSec?: number | null;
}

export interface Turn {
    role: Role;            // filled after role assignment
    speakerId: string;     // "0" | "1" | "unknown" (Deepgram diarization id)
    start: number;         // seconds
    end: number;           // seconds
    text: string;          // transcript text for this turn
}

type Role = 'salesperson' | 'client' | 'unknown';

export type CallStatus = 'queued' | 'ringing' | 'in-progress' | 'completed' | 'busy' | 'failed' | 'no-answer' | 'canceled' | 'unknown';

export type CallResult = 'none' | 'appointment_booked' | 'call_transferred' | 'other';

export type CallIntent = 'none' | 'trade_in' | 'finance' | 'credit' | 'appointment' | 'other';