// ── App utilities / hooks / state ────────────────────────────────────
import { fmt, formatLanguage } from '@/lib/utils';
import { useRecordingUrl, RecordingUrlResponse } from '@/features/call-logs/api';

// ── UI (radix + icons) ───────────────────────────────────────────────
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Phone,
    Clock,
    User,
    Loader2,
    Star,
    DollarSign,
    CreditCard,
    CalendarDays,
    PhoneForwarded,
    Repeat2,
    HelpCircle,
    MinusCircle,
    Globe2
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────
import { type CallLog, Turn, CallIntent, CallResult } from '@/types';

interface CallLogDetailDialogProps {
    log: CallLog;
    open: boolean;
    onClose: () => void;
}

export const getStatusColor = (status: string) => {
    switch (status) {
        case 'completed':
            return 'bg-green-100/50 text-green-800 hover:bg-green-100/50 shadow';
        case 'no-answer':
            return 'bg-destructive text-destructive-foreground hover:bg-destructive shadow';
        case 'busy':
            return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 shadow';
        default:
            return 'bg-gray-200 text-gray-800 hover:bg-gray-200 shadow';
    }
};

const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatIntent = (intent: CallIntent) => {
    switch (intent) {
        case 'trade_in':
            return 'Trade-In';
        case 'finance':
            return 'Finance';
        case 'credit':
            return 'Credit';
        case 'appointment':
            return 'Appointment';
        case 'other':
            return 'Other';
        case 'none':
        default:
            return 'None';
    }
};

const formatResult = (result: CallResult) => {
    switch (result) {
        case 'appointment_booked':
            return 'Appointment Booked';
        case 'call_transferred':
            return 'Call Transferred';
        case 'other':
            return 'Other';
        case 'none':
        default:
            return 'None';
    }
};

export const getIntentBadgeClasses = (intent: CallIntent) => {
    switch (intent) {
        case 'trade_in':
            return 'bg-amber-100 text-amber-800 hover:bg-amber-100 shadow';
        case 'finance':
            return 'bg-sky-100 text-sky-800 hover:bg-sky-100 shadow';
        case 'credit':
            return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100 shadow';
        case 'appointment':
            return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 shadow';
        case 'other':
            return 'bg-slate-100 text-slate-800 hover:bg-slate-100 shadow';
        case 'none':
        default:
            return 'bg-gray-100 text-gray-600 hover:bg-gray-100 shadow';
    }
};

export const getResultBadgeClasses = (result: CallResult) => {
    switch (result) {
        case 'appointment_booked':
            return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 shadow';
        case 'call_transferred':
            return 'bg-blue-100 text-blue-800 hover:bg-blue-100 shadow';
        case 'other':
            return 'bg-slate-100 text-slate-800 hover:bg-slate-100 shadow';
        case 'none':
        default:
            return 'bg-gray-100 text-gray-600 hover:bg-gray-100 shadow';
    }
};

// Normalize sentiment (supports 0–1, -1–1, or 1–5-ish) and render stars
const renderSentimentStars = (sentiment: number | null) => {
    if (sentiment === null || sentiment === undefined) {
        // return <span className="text-xs text-gray-500">No sentiment data</span>;
        sentiment = 0;
    }

    const filled = Math.min(5, sentiment);

    console.log(filled);
    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, idx) => (
                <Star
                    key={idx}
                    className={`w-4 h-4 ${idx < filled ? 'fill-yellow-400 text-yellow-500' : 'text-gray-300'
                        }`}
                />
            ))}
            <span className="ml-2 text-xs text-gray-600">{filled} / 5</span>
        </div>
    );
};

// ---- Format AI JSON transcript ----
const formatTranscriptTurns = (turns: Turn[]) => {
    if (!turns || !Array.isArray(turns)) return null;

    return turns.map((t, i) => {
        const role =
            t.role === 'client'
                ? 'Client'
                : t.role === 'salesperson'
                    ? 'Dealership'
                    : 'Speaker';

        const color =
            role === 'Client'
                ? 'text-blue-700'
                : role === 'Dealership'
                    ? 'text-purple-700'
                    : 'text-gray-700';

        return (
            <div key={i} className="mb-3">
                <span className={`font-semibold ${color}`}>{role}:</span>
                <span className="ml-2">{t.text}</span>
            </div>
        );
    });
};

export function CallLogDetailDialog({ log, open, onClose }: CallLogDetailDialogProps) {
    const {
        data,
        isLoading,
        error,
        isFetching,
    }: {
        data: RecordingUrlResponse | undefined;
        isLoading: boolean;
        error: Error | null;
        isFetching: boolean;
    } = useRecordingUrl({
        callLogId: log.id,
    });

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-purple-900">Call Details</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LEFT SIDE — Call Information */}
                    <Card className="border-purple-200">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-5 h-5 text-purple-600" />
                                    <span className="font-semibold text-lg text-purple-900">
                                        {log.trackingNumber ? fmt(log.trackingNumber) : '-'}
                                    </span>
                                </div>
                                <Badge className={getStatusColor(log.status)}>
                                    {log.status}
                                </Badge>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-purple-500" />
                                    <div>
                                        <Label className="text-sm text-purple-700">
                                            Caller Number
                                        </Label>
                                        <p className="font-medium text-purple-800">
                                            {log.callerNumber ? fmt(log.callerNumber) : ''}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-purple-700" />
                                        <div>
                                            <Label className="text-sm text-purple-600">
                                                Duration
                                            </Label>
                                            <p className="font-medium text-purple-800">
                                                {formatDuration(log.durationSeconds)}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-sm text-purple-600">Call Time</Label>
                                        <p className="font-medium text-purple-800">
                                            {log?.callStartedAt
                                                ? new Date(log.callStartedAt).toLocaleString(undefined, {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: false,
                                                })
                                                : '-'}
                                        </p>
                                    </div>
                                </div>

                                {/* Intent & Result */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <Label className="text-sm text-purple-600">Intent</Label>
                                        <div className="mt-1">
                                            <Badge
                                                className={`inline-flex items-center gap-1 ${getIntentBadgeClasses(
                                                    log.intent
                                                )}`}
                                            >
                                                {log.intent === 'trade_in' && (
                                                    <Repeat2 className="w-3 h-3" />
                                                )}
                                                {log.intent === 'finance' && (
                                                    <DollarSign className="w-3 h-3" />
                                                )}
                                                {log.intent === 'credit' && (
                                                    <CreditCard className="w-3 h-3" />
                                                )}
                                                {log.intent === 'appointment' && (
                                                    <CalendarDays className="w-3 h-3" />
                                                )}
                                                {(log.intent === 'other' ||
                                                    log.intent === 'none') && (
                                                        <HelpCircle className="w-3 h-3" />
                                                    )}
                                                <span>{formatIntent(log.intent)}</span>
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-sm text-purple-600">Result</Label>
                                        <div className="mt-1">
                                            <Badge
                                                className={`inline-flex items-center gap-1 ${getResultBadgeClasses(
                                                    log.result
                                                )}`}
                                            >
                                                {log.result === 'appointment_booked' && (
                                                    <CalendarDays className="w-3 h-3" />
                                                )}
                                                {log.result === 'call_transferred' && (
                                                    <PhoneForwarded className="w-3 h-3" />
                                                )}
                                                {log.result === 'other' && (
                                                    <HelpCircle className="w-3 h-3" />
                                                )}
                                                {log.result === 'none' && (
                                                    <MinusCircle className="w-3 h-3" />
                                                )}
                                                <span>{formatResult(log.result)}</span>
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Sentiment */}
                                <div className="pt-2">
                                    <Label className="text-sm text-purple-600">Sentiment</Label>
                                    <div className="mt-1">
                                        {renderSentimentStars(log.sentiment)}
                                    </div>
                                </div>
                            </div>

                            {/* Audio Bar */}
                            <Label className="text-sm text-purple-600 mb-3 block">
                                Call Recording
                            </Label>
                            {log.recordingUrl ? (
                                <div className="mt-1">
                                    {/* Loading state */}
                                    {isLoading || isFetching ? (
                                        <div className="text-sm text-purple-800 mb-2 flex flex-row gap-2">
                                            <span>Loading recording...</span>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin text-purple-250" />
                                        </div>
                                    ) : null}

                                    {/* Error state */}
                                    {error && (
                                        <div className="text-sm text-red-500 mb-2">
                                            Failed to load recording.
                                        </div>
                                    )}

                                    {/* Only render audio when we actually have a URL */}
                                    {data?.url && !isFetching && (
                                        <audio controls className="w-full" preload="metadata">
                                            <source src={data.url} type="audio/mpeg" />
                                            Your browser does not support the audio element.
                                        </audio>
                                    )}
                                </div>
                            ) : (
                                <div className="text-sm text-purple-800 bg-gray-100 p-4 rounded-lg">
                                    Recording not available.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* RIGHT SIDE — Transcript */}
                    <Card className="border-purple-200">
                        <CardContent className="p-3 h-full">
                            <div className="flex items-center justify-between mb-3">
                                <Label className="text-sm text-purple-600 block">
                                    Call Transcription
                                </Label>
                                {log.transcriptJson?.language && (
                                    <div className="flex items-center gap-1 text-xs text-purple-700">
                                        <Globe2 className="w-3 h-3" />
                                        <span>
                                            {formatLanguage(log.transcriptJson.language)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {log.transcriptJson?.turns ? (
                                <div className="bg-purple-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                                    <div className="text-sm leading-relaxed">
                                        {formatTranscriptTurns(log.transcriptJson.turns)}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-100 p-4 rounded-lg text-center text-purple-800 text-sm">
                                    No transcription available for this call
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog >
    );
}
