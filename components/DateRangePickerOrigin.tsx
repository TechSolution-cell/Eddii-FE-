'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { DateRange as ReactDayPickerRange } from 'react-day-picker';

export interface DateRange {
  from?: Date;
  to?: Date;
}

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  visiblePresets?: PresetType[];
  initialPreset?: PresetType;
  showSearch? : boolean
}

type PresetType = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'last90days' | 'last180days' | 'thismonth' | 'lastmonth' | 'custom';

// const ALL_PRESETS: PresetType[] = [
//   "today",
//   "yesterday",
//   "last7days",
//   "last30days",
//   "last90days",
//   "last180days",
//   "thismonth",
//   "lastmonth",
//   "custom",
// ];

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetType>('last30days');
  const [customRange, setCustomRange] = useState<DateRange>(dateRange);
  const [searchQuery, setSearchQuery] = useState('');

  
  const presets = [
    { id: 'today' as PresetType, label: 'Today' },
    { id: 'yesterday' as PresetType, label: 'Yesterday' },
    { id: 'last7days' as PresetType, label: 'Last 7 Days' },
    { id: 'last30days' as PresetType, label: 'Last 30 Days' },
    { id: 'thismonth' as PresetType, label: 'This Month' },
    { id: 'lastmonth' as PresetType, label: 'Last Month' },
    { id: 'custom' as PresetType, label: 'Custom Range' },
  ];

  const getPresetRange = (preset: PresetType): DateRange => {
    const now = new Date();
    switch (preset) {
      case 'today':
        return { from: startOfDay(now), to: endOfDay(now) };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
      case 'last7days':
        return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
      case 'last30days':
        return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
      case 'thismonth':
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'lastmonth':
        const lastMonth = subMonths(now, 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      case 'custom':
        return customRange;
      default:
        return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    }
  };

  const handlePresetSelect = (preset: PresetType) => {
    setSelectedPreset(preset);
    if (preset !== 'custom') {
      const range = getPresetRange(preset);
      setCustomRange(range);

      {/** Close the picker*/ }
      onDateRangeChange(range);
      setIsOpen(false);
    }
  };

  const handleApply = () => {
    const range = selectedPreset === 'custom' ? customRange : getPresetRange(selectedPreset);
    onDateRangeChange(range);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
    // Reset to current values
    setCustomRange(dateRange);
  };

  const formatDateRange = (range: DateRange) => {
    if (!range.from && !range.to) return 'Select date range';
    if (!range.from) return `Until ${format(range.to!, 'MM/dd/yyyy')}`;
    if (!range.to) return `From ${format(range.from, 'MM/dd/yyyy')}`;
    return `${format(range.from, 'MM/dd/yyyy')} - ${format(range.to, 'MM/dd/yyyy')}`;
  };

  const filteredPresets = presets.filter(preset =>
    preset.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="justify-start text-left font-normal min-w-[250px]"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange(dateRange)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-0 rounded-xl" align="start">
        <div className="flex">
          {/* Left sidebar with presets */}
          <div className={`w-48 border-r bg-muted !border-[#e5e7eb] ${selectedPreset !== 'custom' ? 'min-w-[250px]' : ''}`}>
            <div className="p-3 border-b">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="p-2">
              {filteredPresets.map((preset) => (
                <Button
                  key={preset.id}
                  variant={selectedPreset === preset.id ? 'default' : 'ghost'}
                  className="w-full justify-start text-sm mb-1"
                  onClick={() => handlePresetSelect(preset.id)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Right side with calendar or custom range */}
          {selectedPreset === 'custom' ? (
            <div className='p-4'>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Date Range</label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Input
                      placeholder="Start date"
                      value={customRange.from ? format(customRange.from, 'MM/dd/yyyy') : ''}
                      readOnly
                      className="w-32"
                    />
                    <span>-</span>
                    <Input
                      placeholder="End date"
                      value={customRange.to ? format(customRange.to, 'MM/dd/yyyy') : ''}
                      readOnly
                      className="w-32"
                    />
                  </div>
                </div>
                <Calendar
                  mode="range"
                  className='w-[500px]'
                  selected={customRange as ReactDayPickerRange}
                  onSelect={(range: ReactDayPickerRange | undefined) => setCustomRange(range || {})}
                  numberOfMonths={2}
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-between mt-4 pt-4 border-t !border-[#e5e7eb]">
                <span className="text-xs text-muted-foreground">
                  {formatDateRange(selectedPreset === 'custom' ? customRange : getPresetRange(selectedPreset))}
                </span>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleApply}>
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          ) : ''}
        </div>
      </PopoverContent>
    </Popover>
  );
}
