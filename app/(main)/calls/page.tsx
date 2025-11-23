'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CallLogDetailDialog, getStatusColor } from './components/CallLogDetailDialog';
import { DateRangePicker, DateRange } from '@/components/DateRangePicker';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { Eye, Phone, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CallDetails = {
  id: string;
  caller_number: string;
  tracking_number: string;
  duration_seconds: number;
  status: string;
  recording_url: string | null;
  transcription: string | null;

  business_id?: string;
  marketing_source_name: string,

  created_at?: string;
  updated_at?: string;
};


const mockCalls: CallDetails[] = [
  {
    id: '1',
    caller_number: '+1-555-555-0102',
    tracking_number: '+1-415-200-8079',
    marketing_source_name: 'Facebook Ads Campaign',
    status: 'no-answer',
    duration_seconds: 45,
    recording_url: '',
    transcription: ''
  },
  {
    id: '2',
    caller_number: '+1-555-555-0101',
    tracking_number: '+1-415-200-8079',
    marketing_source_name: 'Google Ads Campaign',
    status: 'completed',
    duration_seconds: 180,
    recording_url: '',
    transcription: ''
  },
  {
    id: '3',
    caller_number: '+1-555-555-0101',
    tracking_number: '+1-415-200-8079',
    marketing_source_name: 'Google Ads Campaign',
    status: 'completed',
    duration_seconds: 180,
    recording_url: '',
    transcription: ''
  },
  {
    id: '4',
    caller_number: '+1-555-555-0101',
    tracking_number: '+1-415-200-8079',
    marketing_source_name: 'Google Ads Campaign',
    status: 'completed',
    duration_seconds: 180,
    recording_url: '',
    transcription: ''
  },
  {
    id: '5',
    caller_number: '+1-555-555-0101',
    tracking_number: '+1-415-200-8079',
    marketing_source_name: 'Google Ads Campaign',
    status: 'completed',
    duration_seconds: 180,
    recording_url: '',
    transcription: ''
  },
  {
    id: '6',
    caller_number: '+1-555-555-0101',
    tracking_number: '+1-415-200-8079',
    marketing_source_name: 'Google Ads Campaign',
    status: 'completed',
    duration_seconds: 180,
    recording_url: '',
    transcription: ''
  },
  {
    id: '7',
    caller_number: '+1-555-555-0101',
    tracking_number: '+1-415-200-8079',
    marketing_source_name: 'Google Ads Campaign',
    status: 'completed',
    duration_seconds: 180,
    recording_url: '',
    transcription: ''
  },
  {
    id: '8',
    caller_number: '+1-555-555-0101',
    tracking_number: '+1-415-200-8079',
    marketing_source_name: 'Google Ads Campaign',
    status: 'completed',
    duration_seconds: 180,
    recording_url: '',
    transcription: ''
  },
  {
    id: '9',
    caller_number: '+1-555-555-0101',
    tracking_number: '+1-415-200-8079',
    marketing_source_name: 'Google Ads Campaign',
    status: 'completed',
    duration_seconds: 180,
    recording_url: '',
    transcription: ''
  },
  {
    id: '10',
    caller_number: '+1-555-555-0101',
    tracking_number: '+1-415-200-8079',
    marketing_source_name: 'Google Ads Campaign',
    status: 'completed',
    duration_seconds: 180,
    recording_url: '',
    transcription: ''
  },
  {
    id: '11',
    caller_number: '+1-555-555-0101',
    tracking_number: '+1-415-200-8079',
    marketing_source_name: 'Google Ads Campaign',
    status: 'completed',
    duration_seconds: 180,
    recording_url: '',
    transcription: ''
  },
  {
    id: '12',
    caller_number: '+1-555-555-0101',
    tracking_number: '+1-415-200-8079',
    marketing_source_name: 'Google Ads Campaign',
    status: 'completed',
    duration_seconds: 180,
    recording_url: '',
    transcription: ''
  },
];

export default function CallLogsDashboard() {

  const [selectedCall, setSelectedCall] = useState<CallDetails | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Refrecsh Calls -- handleRefresh
  // const [calls, callsLoading, callsError, 
  const refreshCalls = () => {

  }
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(subDays(new Date(), 29)),
    to: endOfDay(new Date())
  });

  // Calculate pagination for calls
  const totalCalls = mockCalls.length;
  const paginatedCalls = mockCalls.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    setCurrentPage(1); // Reset to first page when changing date range
  };

  const handleViewDetails = (call: CallDetails) => {
    setSelectedCall(call);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Card className="border-purple-200 border bg-gradient-to-br from-white to-purple-50">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
          <div>
            <CardTitle className="text-2xl text-white">Call Logs</CardTitle>
            <CardDescription className='mt-2 mb-5 text-white/80'>View call details and transcripts</CardDescription>
          </div>
        </CardHeader>

        <CardContent className='mt-3'>
          {/* DateRangePicker */}
          <div className='flex justify-end mb-3 gap-5'>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
            />
            <div className="flex items-center gap-2 text-sm text-purple-600">
              <Phone className="w-4 h-4" />
              <span>{mockCalls.length} total calls</span>
            </div>
          </div>

          {mockCalls.length === 0 ? (
            <div className="text-center py-8 text-purple-500">
              No calls found. Calls will appear here once they start coming in.
            </div>
          ) : (
            <>
              <div className="min-h-0 max-h-[calc(100vh-338px)] overflow-y-auto">
                <Table>
                  <TableHeader className='sticky top-0 z-10'>
                    <TableRow className="bg-purple-200 hover:bg-purple-200">
                      <TableHead className="text-purple-800 font-semibold ">Caller</TableHead>
                      <TableHead className="text-purple-800 font-semibold">Tracking Number</TableHead>
                      <TableHead className="text-purple-800 font-semibold">Marketing Source</TableHead>
                      <TableHead className="text-purple-800 font-semibold">Duration</TableHead>
                      <TableHead className="text-purple-800 font-semibold">Status</TableHead>
                      <TableHead className="text-purple-800 font-semibold">Date</TableHead>
                      <TableHead className="text-right text-purple-800 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className='cursor-pointer'>
                    {paginatedCalls.map((call) => (
                      <TableRow key={call.id} className="hover:bg-purple-100/70">
                        <TableCell className="font-medium text-purple-900">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            {call.caller_number}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-purple-900">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-purple-600" />
                            {call.tracking_number}
                          </div>
                        </TableCell>
                        <TableCell className="text-purple-600">{call.marketing_source_name}</TableCell>
                        <TableCell className="text-purple-600">{formatDuration(call.duration_seconds)}</TableCell>
                        <TableCell className="text-purple-600">
                          <Badge className={getStatusColor(call.status)}>
                            {call.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-purple-600">{call.created_at}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(call)}
                              className="text-purple-600 border-purple-200 hover:bg-purple-50 gap-1"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {mockCalls.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={totalCalls}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              )}
            </>

          )}
        </CardContent>
      </Card>
      {selectedCall && (
        <CallLogDetailDialog
          call={selectedCall}
          open={!!selectedCall}
          onClose={() => setSelectedCall(null)}
        />
      )}
    </>
  );
}
