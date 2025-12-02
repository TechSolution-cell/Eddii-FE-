"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  format,
  subDays,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { DateRange as ReactDayPickerRange } from "react-day-picker";

export interface DateRange {
  from?: Date;
  to?: Date;
}

export type PresetType =
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "last90days"
  | "last180days"
  | "thismonth"
  | "lastmonth"
  | "custom";

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  visiblePresets?: PresetType[];
  initialPreset?: PresetType;
  presetLabels?: Partial<Record<PresetType, string>>;
  showSearch?: boolean;
}

const ALL_PRESETS: PresetType[] = [
  "today",
  "yesterday",
  "last7days",
  "last30days",
  "last90days",
  "last180days",
  "thismonth",
  "lastmonth",
  "custom",
];

const DEFAULT_VISIBLE: PresetType[] = [
  "today",
  "yesterday",
  "last7days",
  "last30days",
  "thismonth",
  "lastmonth",
  "custom",
];

const DEFAULT_LABELS: Record<PresetType, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last7days: "Last 7 Days",
  last30days: "Last 30 Days",
  last90days: "Last 90 Days",
  last180days: "Last 180 Days",
  thismonth: "This Month",
  lastmonth: "Last Month",
  custom: "Custom Range",
};

function computePresetRange(
  preset: Exclude<PresetType, "custom">,
  now: Date
): DateRange {
  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": {
      const yesterday = subDays(now, 1);
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
    }
    case "last7days":
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case "last30days":
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    case "last90days":
      return { from: startOfDay(subDays(now, 89)), to: endOfDay(now) };
    case "last180days":
      return { from: startOfDay(subDays(now, 179)), to: endOfDay(now) };
    case "thismonth":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "lastmonth": {
      const lastMonth = subMonths(now, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }
  }
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  visiblePresets,
  initialPreset,
  presetLabels,
  showSearch = true,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const labelMap = useMemo(
    () =>
    ({
      ...DEFAULT_LABELS,
      ...(presetLabels || {}),
    } as Record<PresetType, string>),
    [presetLabels]
  );

  const finalVisible = useMemo<PresetType[]>(() => {
    const base = (
      visiblePresets && visiblePresets.length > 0 ? visiblePresets : DEFAULT_VISIBLE
    ).filter((p): p is PresetType => ALL_PRESETS.includes(p as PresetType));
    return base.length > 0 ? base : ["custom"];
  }, [visiblePresets]);

  const initialSelected = useMemo<PresetType>(() => {
    if (initialPreset && finalVisible.includes(initialPreset)) return initialPreset;
    return finalVisible[0] || "custom";
  }, [initialPreset, finalVisible]);

  const [selectedPreset, setSelectedPreset] = useState<PresetType>(initialSelected);
  const [customRange, setCustomRange] = useState<DateRange>(dateRange);
  const [searchQuery, setSearchQuery] = useState("");

  // Helper that uses customRange only for "custom"
  const getRangeForPreset = (preset: PresetType): DateRange => {
    if (preset === "custom") return customRange;
    const now = new Date();
    return computePresetRange(preset as Exclude<PresetType, "custom">, now);
  };

  // 🔧 keep selectedPreset & customRange in sync with external dateRange
  useEffect(() => {
    const { from, to } = dateRange;

    // If incomplete range, treat as custom
    if (!from || !to) {
      setSelectedPreset("custom");
      setCustomRange(dateRange);
      return;
    }

    const now = new Date();
    let matchedPreset: PresetType | null = null;

    for (const preset of finalVisible) {
      if (preset === "custom") continue;

      const presetRange = computePresetRange(
        preset as Exclude<PresetType, "custom">,
        now
      );
      if (!presetRange.from || !presetRange.to) continue;

      if (
        presetRange.from.getTime() === from.getTime() &&
        presetRange.to.getTime() === to.getTime()
      ) {
        matchedPreset = preset;
        break;
      }
    }

    setSelectedPreset(matchedPreset ?? "custom");
    setCustomRange(dateRange);
  }, [dateRange, finalVisible]);

  const handlePresetSelect = (preset: PresetType) => {
    setSelectedPreset(preset);
    if (preset !== "custom") {
      const range = getRangeForPreset(preset);
      setCustomRange(range);
      onDateRangeChange(range);
      setIsOpen(false);
    }
  };

  const handleApply = () => {
    const range =
      selectedPreset === "custom" ? customRange : getRangeForPreset(selectedPreset);
    onDateRangeChange(range);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setCustomRange(dateRange);
  };

  const formatDateRange = (range: DateRange) => {
    if (!range.from && !range.to) return "Select date range";
    if (!range.from) return `Until ${format(range.to!, "MM/dd/yyyy")}`;
    if (!range.to) return `From ${format(range.from, "MM/dd/yyyy")}`;
    return `${format(range.from, "MM/dd/yyyy")} - ${format(range.to, "MM/dd/yyyy")}`;
  };

  const computedPresets = useMemo(
    () => finalVisible.map((id) => ({ id, label: labelMap[id] })),
    [finalVisible, labelMap]
  );

  const filteredPresets = useMemo(
    () =>
      computedPresets.filter((preset) =>
        preset.label.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [computedPresets, searchQuery]
  );

  const effectiveRange =
    selectedPreset === "custom" ? customRange : getRangeForPreset(selectedPreset);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="justify-start text-left font-normal min-w-52 h-10"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange(effectiveRange)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-0 rounded-xl" align="start">
        <div className="flex">
          {/* Left sidebar with presets */}
          <div
            className={`w-52 border-r bg-muted !border-[#e5e7eb] ${selectedPreset !== "custom" ? "min-w-52" : ""
              }`}
          >
            {showSearch && (
              <div className="p-3 border-b bg-white">
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8"
                />
              </div>
            )}
            <div className="p-2 max-h-[330px] overflow-auto bg-white">
              {filteredPresets.map((preset) => (
                <Button
                  key={preset.id}
                  variant={selectedPreset === preset.id ? "default" : "ghost"}
                  className="w-full justify-start text-sm mb-1"
                  onClick={() => handlePresetSelect(preset.id as PresetType)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Right side with calendar for custom range */}
          {selectedPreset === "custom" ? (
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Date Range</label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Input
                      placeholder="Start date"
                      value={
                        customRange.from
                          ? format(customRange.from, "MM/dd/yyyy")
                          : ""
                      }
                      readOnly
                      className="w-32"
                    />
                    <span>-</span>
                    <Input
                      placeholder="End date"
                      value={
                        customRange.to
                          ? format(customRange.to, "MM/dd/yyyy")
                          : ""
                      }
                      readOnly
                      className="w-32"
                    />
                  </div>
                </div>
                <Calendar
                  mode="range"
                  className="w-[500px]"
                  selected={customRange as ReactDayPickerRange}
                  onSelect={(range: ReactDayPickerRange | undefined) =>
                    setCustomRange(range || {})
                  }
                  numberOfMonths={2}
                />
              </div>

              <div className="flex justify-between mt-4 pt-4 border-t !border-[#e5e7eb]">
                <span className="text-xs text-muted-foreground">
                  {formatDateRange(
                    selectedPreset === "custom"
                      ? customRange
                      : getRangeForPreset(selectedPreset)
                  )}
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
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
