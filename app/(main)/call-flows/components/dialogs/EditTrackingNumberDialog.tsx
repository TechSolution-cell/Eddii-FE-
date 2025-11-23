"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ── App utilities / hooks / state ────────────────────────────────────
import { useUpdateTrackingNumber } from "@/features/call-tracking/api";
import { buildChangedPayload, fmt } from "@/lib/utils";

// ── UI (radix + icons) ───────────────────────────────────────────────
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
import { Phone, Hash, Loader2 } from "lucide-react";
import { MarketingSourcePicker } from "../MarketingSourcePicker";

// ── Types ─────────────────────────────────────────────────────────────
import { type TrackingNumber } from "@/types";
import { notify } from "@/lib/notify";

/** ───────────────────────── Zod Schema ─────────────────────────
 * - trackingNumber is displayed but not editable here.
 * - forwardingVoiceNumber: same rules as Create dialog; normalize to E.164.
 * - marketingSourceId: optional (empty string allowed).
 */
const UpdateSchema = z.object({
  forwardingVoiceNumber: z
    .string()
    .trim()
    .superRefine((s, ctx) => {
      if (s === "") return; // allow blank to mean "remove forwarding"
      const compact = s.replace(/[ .()\-\t]/g, "");
      const digits = s.replace(/\D/g, "");
      const e164Ok = /^\+1\d{10}$/.test(compact);
      const plainOk = digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
      if (compact.includes("+")) {
        if (!e164Ok) {
          ctx.addIssue({
            code: "custom",
            message: "Enter a 10-digit number or +1 followed by 10 digits",
          });
        }
      } else if (!plainOk) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a 10-digit number or +1 followed by 10 digits",
        });
      }
    })
    .transform((s) => {
      const digits = s.replace(/\D/g, "");
      if (digits === "") return ""; // blank = cleared
      const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
      return `+1${national}`;
    }),
  marketingSourceId: z.union([z.literal(""), z.literal("#"), z.uuid()])
    .transform((s) => {
      if (s === '#') return '';
      return s;
    }),
});

type UpdateValues = z.infer<typeof UpdateSchema>;


interface EditTrackingNumberDialogProps {
  open?: boolean,
  onOpenChange?: (v: boolean) => void,
  tn: TrackingNumber | null;
}

export function EditTrackingNumberDialog({ open, onOpenChange, tn, }: EditTrackingNumberDialogProps) {
  const updateTn = useUpdateTrackingNumber();

  const defaultForwarding = useMemo(() => {
    // Try to read either properly named or legacy misspelled field from the record
    // (Your table uses `fowardingVoiceNumber`; API uses `forwardingVoiceNumber`.)
    const raw =
      tn?.forwardingVoiceNumber ??
      tn?.forwardingVoiceNumber ?? "";
    return typeof raw === "string" ? raw : "";
  }, [tn]);

  const defaultMarketingSourceId = useMemo(() => {
    const id = tn?.marketingSource?.id ?? "";
    return typeof id === "string" ? id : "";
  }, [tn]);

  // ────────────────── React Hook Form ──────────────────
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue: setFormValue,
    formState: { errors, isDirty },
  } = useForm<UpdateValues>({
    resolver: zodResolver(UpdateSchema),
    defaultValues: {
      forwardingVoiceNumber: defaultForwarding,
      marketingSourceId: defaultMarketingSourceId,
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  // Keep form synced when dialog opens for a different record
  useEffect(() => {
    if (open && tn) {
      const prettyForwardingVoiceNumber =
        defaultForwarding && defaultForwarding.trim() !== ""
          ? fmt(String(defaultForwarding))
          : "";

      reset({
        forwardingVoiceNumber: prettyForwardingVoiceNumber,
        marketingSourceId: defaultMarketingSourceId,
      });
    }
  }, [open, tn, reset, defaultForwarding, defaultMarketingSourceId]);

  const forwardingRaw = watch("forwardingVoiceNumber");
  const forwardingValid = useMemo(() => {
    const d = (forwardingRaw ?? "").replace(/\D/g, "");
    // empty = allowed; otherwise must be 10 or 11 (with leading 1)
    if (d.length === 0) return true;
    return d.length === 10 || (d.length === 11 && d.startsWith("1"));
  }, [forwardingRaw]);

  const handleEdit = async (values: UpdateValues) => {
    if (!tn || !tn?.id) return;

    if (!errors) return; // check if the form is valid

    try {
      const payload = buildChangedPayload(
        {
          forwardingVoiceNumber:
            values.forwardingVoiceNumber === "" ? null : values.forwardingVoiceNumber,
          marketingSourceId: values.marketingSourceId || null,
        },
        {
          forwardingVoiceNumber: defaultForwarding || null,
          marketingSourceId: defaultMarketingSourceId || null,
        }
      );

      if (Object.keys(payload).length === 0) {
        notify.info('No changes to save.');
        // onOpenChange?.(false);
        return;
      }

      await updateTn.mutateAsync({
        id: tn.id,
        ...payload,
      });

      notify.ok('Tracking number updated successfully.');
      onOpenChange?.(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      notify.err('Failed to update tracking number.', { description: message, duration: 6000 });
    }
  };

  const handleDialogOpenChange = (next: boolean) => {
    if (!next && updateTn.isPending) return;
    onOpenChange?.(next);
  };

  const readOnlyNumber = tn?.number ?? "";

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className="max-w-3xl overflow-hidden"
        onEscapeKeyDown={(e) => {
          if (updateTn.isPending) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (updateTn.isPending) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl text-purple-700">
            Update Tracking Number
          </DialogTitle>
          <DialogDescription className="text-purple-800/80">
            Change the forwarding destination or marketing source.
          </DialogDescription>
        </DialogHeader>
        <Separator className="bg-purple-900/20" />

        {!tn ? (
          <div className="flex items-center justify-center py-10 gap-2 text-purple-700">
            <Spinner variant="purple-700" track="purple-200" label="Loading..." />
            Loading…
          </div>
        ) : (
          <form onSubmit={handleSubmit(handleEdit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
              {/* Read-only tracking number */}
              <div className="space-y-3">
                <Label className="select-none">Tracking Number</Label>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <Input
                    value={fmt(String(readOnlyNumber))}
                    readOnly
                    className="bg-muted/40 text-gray-700 h-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Tracking number is locked and cannot be changed.
                </p>
              </div>

              {/* Forwarding number */}
              <div className="space-y-3">
                <Label htmlFor="forwardingNumber" className="select-none">
                  Forwarding Number
                </Label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
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
                    disabled={updateTn.isPending}
                  />
                </div>
                {errors.forwardingVoiceNumber ? (
                  <p className="text-xs text-red-600">{errors.forwardingVoiceNumber.message}</p>
                ) : forwardingValid && forwardingRaw ? (
                  <p className="text-xs text-purple-700">Using: {fmt(forwardingRaw)}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Leave blank to clear the forwarding destination.
                  </p>
                )}
              </div>

              {/* Marketing source */}
              <div className="space-y-3 md:col-span-2">
                <Label className="select-none">Marketing Source</Label>
                <MarketingSourcePicker
                  value={String((watch("marketingSourceId") ?? "") || "")}
                  onChange={(v) =>
                    setFormValue("marketingSourceId", v, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  disabled={updateTn.isPending}
                  placeholder="Select marketing source"
                />
              </div>
            </div>

            <Separator className="bg-purple-900/20 mt-4" />

            <div className="flex justify-start mt-4 gap-4">
              <Button
                type="submit"
                disabled={updateTn.isPending || !isDirty}
                className="border border-purple-700 bg-purple-600/90 hover:bg-purple-600 hover:border-purple-800 text-white"
              >
                {updateTn.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                {updateTn.isPending ? "Saving…" : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={updateTn.isPending}
                className="border-purple-300 text-purple-600 hover:bg-purple-50"
                onClick={() => onOpenChange?.(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default EditTrackingNumberDialog;
