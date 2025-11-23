import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Phone, Clock, User } from 'lucide-react';

type CallLog = {
    id: string;
    caller_number: string;
    tracking_number: string;
    duration_seconds: number;
    status: string;
    recording_url: string | null;
    transcription: string | null;

    business_id: string;

    created_at?: string;
    updated_at?: string;
};

interface CallLogDetailDialogProps {
    call: CallLog;
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

export function CallLogDetailDialog({ call, open, onClose }: CallLogDetailDialogProps) {
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatTranscription = (transcription: string) => {
        const lines = transcription.split('\n');
        return lines.map((line, index) => {
            if (line.startsWith('dealership:')) {
                return (
                    <div key={index} className="mb-3">
                        <span className="font-semibold text-purple-700">Dealership:</span>
                        <span className="ml-2">{line.substring(12)}</span>
                    </div>
                );
            } else if (line.startsWith('client:')) {
                return (
                    <div key={index} className="mb-3">
                        <span className="font-semibold text-blue-700">Client:</span>
                        <span className="ml-2">{line.substring(8)}</span>
                    </div>
                );
            }
            return <div key={index} className="mb-3">{line}</div>;
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-purple-900">Call Details</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Call Information */}
                    <Card className="border-purple-200">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-5 h-5 text-purple-600" />
                                    <span className="font-semibold text-lg text-purple-900">{call.tracking_number}</span>
                                </div>
                                <Badge className={getStatusColor(call.status)}>
                                    {call.status}
                                </Badge>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-500" />
                                    <div>
                                        <Label className="text-sm text-gray-600">Caller Number</Label>
                                        <p className="font-medium">{call.caller_number}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                    <div>
                                        <Label className="text-sm text-gray-600">Duration</Label>
                                        <p className="font-medium">{formatDuration(call.duration_seconds)}</p>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-sm text-gray-600">Call Time</Label>
                                    <p className="font-medium">
                                        {call.created_at}
                                    </p>
                                </div>
                            </div>

                            {call.recording_url && (
                                <div className="mt-6">
                                    <Label className="text-sm text-gray-600 mb-3 block">Call Recording</Label>
                                    <audio
                                        controls
                                        className="w-full"
                                        preload="metadata"
                                    >
                                        <source src={call.recording_url} type="audio/mpeg" />
                                        <source src={call.recording_url} type="audio/wav" />
                                        Your browser does not support the audio element.
                                    </audio>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Transcription */}
                    <Card className="border-purple-200">
                        <CardContent className="p-6">
                            <Label className="text-sm text-gray-600 mb-3 block">Call Transcription</Label>
                            {call.transcription ? (
                                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                                    <div className="text-sm leading-relaxed">
                                        {formatTranscription(call.transcription)}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500 text-sm">
                                    No transcription available for this call
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}
