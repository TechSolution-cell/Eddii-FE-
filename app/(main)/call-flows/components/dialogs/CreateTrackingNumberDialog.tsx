"use client";

// ──  React & libs  ──────────────────────────────────────────────────────
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ──  App utilities / hooks / state  ────────────────────────────────────
import {
  useAvailableNumbers,
  useProvisionTrackingNumber,
} from "@/features/call-tracking/api";

// ──  UI (radix + icons)  ───────────────────────────────────────────────
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarketingSourcePicker } from "../MarketingSourcePicker";
import { CountryPicker } from "../CountryPicker";
import { Loader2, MapPin, Phone, CheckCircle2, AlertCircle } from "lucide-react";
import { notify } from "@/lib/notify";


// ───────────────────────  Zod Form  ───────────────────────────────
const CreateSchema = z.object({
  country: z.string().length(2, 'Pick a country').transform((s) => s.toUpperCase()),
  areaCode: z.string().regex(/^\d{3}$/, "Enter exactly 3 digits (e.g., 415)"),
  forwardingVoiceNumber: z
    .string()
    .trim()
    .superRefine((s, ctx) => {
      // Allow blank
      if (s === '') return;

      // Remove common separators but keep leading '+'
      const compact = s.replace(/[ .()\-\t]/g, "");
      const digits = s.replace(/\D/g, "");

      const e164Ok = /^\+1\d{10}$/.test(compact);
      const plainOk = digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));

      if (compact.includes("+")) {
        if (!e164Ok) {
          ctx.addIssue({
            code: 'custom',
            message: "Enter a 10-digit number or +1 followed by 10 digits",
          });
        }
      } else {
        if (!plainOk) {
          ctx.addIssue({
            code: 'custom',
            message: "Enter a 10-digit number or +1 followed by 10 digits",
          });
        }
      }
    })
    // Normalize to E.164 (+11234567890) format
    .transform((s) => {
      const digits = s.replace(/\D/g, "");
      if (digits === '') return '';
      const nationalNumber = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
      // localNumber, tenDigitNumber
      return `+1${nationalNumber}`;
    }),
  marketingSourceId: z.union([z.literal(""), z.literal("#"), z.uuid()])
    .transform((s) => {
      if (s === '#') return '';
      return s;
    }),
  trackingNumber: z.string().min(10, "No number is selected"),
});

type CreateValues = z.infer<typeof CreateSchema>;


// ───────────────────────  UI helpers  ───────────────────────────────

// Simple phone formatter (US-ish)
function fmt(num: string) {
  const digits = num.replace(/\D/g, "").slice(0, 11);
  if (digits.startsWith("1") && digits.length >= 11) {
    return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  }
  if (digits.length >= 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  return digits;
}

interface CreateTrackingNumberDialogProps {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  onCreateSucess?: () => void;
}


export function CreateTrackingNumberDialog({ open, onOpenChange, onCreateSucess }: CreateTrackingNumberDialogProps) {

  // ──────────────────  React Hook Form ──────────────────
  const { register, handleSubmit, watch, setValue: setFormValue, reset, formState: { errors } } = useForm<CreateValues>({
    resolver: zodResolver(CreateSchema),
    defaultValues: {
      country: "US",
      areaCode: '',
      forwardingVoiceNumber: '',
      marketingSourceId: '',
      trackingNumber: '',
    },
    mode: 'onChange',
    reValidateMode: 'onChange'
  });

  const country = watch("country");
  const areaCode = watch("areaCode");
  const trackingNumber = watch("trackingNumber");
  const forwardingNumberRaw = watch("forwardingVoiceNumber");
  const forwardingValid = useMemo(() => {
    const d = forwardingNumberRaw?.replace(/\D/g, "") ?? "";
    return d.length === 10 || (d.length === 11 && d.startsWith("1"));
  }, [forwardingNumberRaw]);

  // ──────────────────  Hooks: Available numbers, Marketing sources & Provision  ──────────────────
  const {
    data: availableNumbers,
    isFetching: isFetchingNumbers,
    isError: isErrorFetchingNumbers
  } = useAvailableNumbers({ areaCode: areaCode && areaCode.length === 3 ? areaCode : '', country, limit: 30 });

  const provision = useProvisionTrackingNumber();

  // Auto-clear selected number if area code changes
  useEffect(() => {
    setFormValue('trackingNumber', '');
  }, [areaCode, country, setFormValue]);


  // ───────────────────────────  Handlers  ───────────────────────────────────────
  const handleCreate = async (values: CreateValues) => {
    if (Object.keys(errors).length > 0) return;

    try {
      await provision.mutateAsync(
        {
          trackingNumber: values.trackingNumber,
          forwardingVoiceNumber: values.forwardingVoiceNumber,
          marketingSourceId: values.marketingSourceId,
          areaCode: values.areaCode,
          country: values.country
        }
      );

      notify.ok('Tracking number created successfully.');
      reset();
      onOpenChange?.(false);
      onCreateSucess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      notify.err('Failed to create a tracking number.', { description: message });
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open && provision.isPending) return;
    onOpenChange?.(open);
  }

  // Reset the form when a dialog is opens
  useEffect(() => {
    if (!open) return;

    reset();
  }, [open, reset]);


  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className="max-w-3xl overflow-hidden"
        onEscapeKeyDown={(e) => {
          if (provision.isPending) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (provision.isPending) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl text-purple-700  border-b-transparent"> Add New Tracking Number </DialogTitle>
          <DialogDescription className="text-purple-800/80">
            Search by country and area code, choose a number to purchase, and set where calls should be forwarded.
          </DialogDescription>
        </DialogHeader>
        <Separator className="bg-purple-900/20" />
        <form onSubmit={handleSubmit(handleCreate)}>
          <div className="flex flex-col">
            <div className="grid md:grid-cols-[minmax(0,1fr)_1px_20rem] grid-cols-1 gap-5 w-full">

              {/* ──  Left Column - Form Fields  ─────────────────────────────────── */}
              <div className="space-y-8">
                <div className="grid gap-3">
                  <Label htmlFor="areaCode" /*className="text-purple-800"*/ className="select-none">Country & Area Code</Label>
                  <div className="flex items-center gap-2">
                    <CountryPicker
                      value={country}
                      defaultValue="US"
                      onChange={(iso2) => setFormValue("country", iso2, { shouldValidate: true, shouldDirty: true })}
                      disabled={provision.isPending}
                      autoSelectOnMount={true}
                    />

                    <Input
                      id="areaCode"
                      inputMode="numeric"
                      placeholder="Area code (e.g., 415)"
                      maxLength={3}
                      className="border-purple-200 focus:border-purple-500 w-40 h-10"
                      {...register("areaCode")}
                      onChange={(e) =>
                        setFormValue(
                          "areaCode",
                          e.target.value.replace(/\D/g, "").slice(0, 3),
                          { shouldValidate: true, shouldDirty: true }
                        )
                      }
                    />
                  </div>
                  {errors.areaCode ? (
                    <p className="text-xs text-red-600">{errors.areaCode.message}</p>
                  ) : (
                    areaCode.length > 0 &&
                    areaCode.length < 3 && (
                      <p className="text-sm text-purple-600">
                        Enter {3 - areaCode.length} more digit
                        {3 - areaCode.length > 1 ? "s" : ""} to search
                      </p>
                    )
                  )}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="forwardingNumber" className="select-none">Forwarding Number</Label>
                  <Input
                    id="forwardingNumber"
                    placeholder="e.g., +1 012 345 6789"
                    className="border-purple-200 focus:border-purple-500 h-10"
                    {...register("forwardingVoiceNumber")}
                    onChange={(e) =>
                      setFormValue("forwardingVoiceNumber", e.target.value, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  />
                  {errors.forwardingVoiceNumber ? (
                    <p className="text-xs text-red-600"> {errors.forwardingVoiceNumber.message} </p>
                  ) : forwardingValid && forwardingNumberRaw ? (
                    <p className="text-xs text-purple-700"> Using: {fmt(forwardingNumberRaw)} </p>
                  ) : null}
                </div>

                <div className="grid gap-3 grid-cols-[minmax(0,1fr)]">
                  <Label htmlFor="marketingSource" className="select-none">Marketing Source</Label>
                  <MarketingSourcePicker
                    value={watch("marketingSourceId")}
                    onChange={(v) => {
                      setFormValue("marketingSourceId", v, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }}
                    includeNoneOption={false}
                    disabled={provision.isPending}
                    placeholder="Select marketing source"
                  />
                  {/* {errors.marketingSourceId && (
                    <p className="text-xs text-red-600">
                      {errors.marketingSourceId.message}
                    </p>
                  )} */}
                </div>
              </div>
              <Separator orientation="vertical" className="bg-purple-900/20" />
              <Separator orientation="horizontal" className="bg-purple-900/20 block md:hidden" />

              {/* ────────────  Right side - Available Numbers   ──────────────────────── */}
              <div className="flex flex-col h-80 select-none">
                <div className="h-full flex flex-col">
                  <h1 className="text-md font-semibold text-purple-700 text-center">
                    Numbers available for purchase
                  </h1>
                  <div className="mt-1 flex items-center justify-center" aria-live="polite" role="status">
                    {errors.trackingNumber?.message ? (
                      <div className="flex items-center gap-2 text-xs text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">{errors.trackingNumber.message}</span>
                      </div>
                    ) : trackingNumber ? (
                      <div className="flex items-center gap-2 text-xs text-purple-700">
                        <CheckCircle2 className="h-4 w-4 text-purple-600" />
                        <span>
                          <span className="font-medium">{fmt(trackingNumber)}</span> selected
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {(() => {
                    const isLoading = isFetchingNumbers;
                    const hasError = isErrorFetchingNumbers;
                    const awaitingAreaCode = availableNumbers == null;
                    const numbers = availableNumbers ?? [];
                    const noResults = numbers.length === 0;

                    const statusProps = {
                      className: "flex-1 flex items-center justify-center flex-col gap-2",
                      "aria-live": "polite" as const,
                      role: "status",
                    };

                    if (isLoading || hasError) {
                      return (
                        <div {...statusProps}>
                          <p className="text-purple-800/80 text-center">
                            {isLoading ? "Loading..." : "Failed to load. Try again."}
                          </p>
                          {isLoading && (
                            <Spinner
                              variant="purple-700"
                              track="purple-200"
                              label="Loading available numbers..."
                            />
                          )}
                        </div>
                      );
                    }

                    if (awaitingAreaCode) {
                      return (
                        <div {...statusProps}>
                          <p className="text-center text-purple-800/80">
                            Enter a valid 3-digit area code to see available numbers.
                          </p>
                        </div>
                      );
                    }

                    if (noResults) {
                      return (
                        <div {...statusProps}>
                          <p className="text-center text-purple-800/80">
                            No available numbers found for this area code.
                          </p>
                        </div>
                      );
                    }

                    // Results
                    return (
                      <ScrollArea className="pr-2 h-72 pt-5">
                        <RadioGroup
                          value={trackingNumber}
                          onValueChange={(val) =>
                            setFormValue("trackingNumber", val, {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
                          }
                        >
                          <div className="space-y-2">
                            {numbers.map(({ phoneNumber, locality, region, isoCountry }) => (
                              <div
                                key={phoneNumber}
                                className="flex items-center border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors select-none"
                              >
                                <label
                                  htmlFor={phoneNumber}
                                  className="flex items-start gap-3 p-2 rounded-lg cursor-pointer w-full"
                                >
                                  <RadioGroupItem
                                    value={phoneNumber}
                                    id={phoneNumber}
                                    className="mt-1"
                                    aria-label={`Select ${phoneNumber}`}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex gap-2 pb-2 items-center">
                                      <Phone className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm font-semibold text-gray-900/80">
                                        {fmt(phoneNumber)}
                                      </span>
                                    </div>
                                    <div className="text-sm text-purple-600 flex items-center gap-1.5">
                                      <MapPin className="h-4 w-4 text-muted-foreground" />
                                      <span>{locality ?? 'Local'}, {region}, {isoCountry}</span>
                                    </div>

                                    {/* ────────────  Badges (Voice, SMS, MMS)   ──────────────────────── */}
                                    {/* {capabilities && (
                                      <div className="mt-2 flex flex-wrap gap-1.5">
                                        {capabilities.voice && <Badge variant="secondary">Voice</Badge>}
                                        {capabilities.sms && <Badge variant="secondary">SMS</Badge>}
                                        {capabilities.mms && <Badge variant="secondary">MMS</Badge>}
                                      </div>
                                    )} */}
                                  </div>

                                </label>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                      </ScrollArea>
                    );
                  })()}
                </div>
              </div>
            </div>
            <Separator className="bg-purple-900/20 mt-3" />
            <div className="flex justify-start mt-4 w-[100%] gap-4">
              <Button
                type="submit"
                disabled={
                  provision.isPending
                  // !forwardingValid ||
                  // !watch("marketingSourceId") ||
                  // !trackingNumber
                }
                // disabled={provision.isPending}
                className="border border-purple-700 bg-purple-600/90 hover:bg-purple-600 hover:border-purple-800 text-white"
              >
                {provision.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                {provision.isPending ? "Creating Number..." : "Create Number"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={provision.isPending}
                onClick={() => { onOpenChange?.(false); }}
                className="border-purple-300 text-purple-600 hover:bg-purple-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
