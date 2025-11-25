import { toast } from 'sonner';
import type { ExternalToast } from 'sonner';

type Opts = ExternalToast | undefined;

const DEFAULTS = {
    success: 2200, // ms
    error: 6000,
    info: 3000,
    warning: 4000,
} as const;

export const notify = {
    ok: (msg: string, opts?: Opts) =>
        toast.success(msg, { duration: DEFAULTS.success, ...opts }),

    err: (msg: string, opts?: Opts) =>
        toast.error(msg, { duration: DEFAULTS.error, ...opts }),

    info: (msg: string, opts?: Opts) =>
        toast.info?.(msg, { duration: DEFAULTS.info, ...opts }) ?? toast(msg, { duration: DEFAULTS.info, ...opts }),

    warn: (msg: string, opts?: Opts) =>
        toast.warning?.(msg, { duration: DEFAULTS.warning, ...opts }) ?? toast(msg, { duration: DEFAULTS.warning, ...opts }),

    // Handy wrapper for async flows
    // usage: await notify.promise(apiCall(), { loading: 'Saving...', success: 'Saved!', error: 'Failed' })
    promise<T>(
        p: Promise<T>,
        messages: { loading: string; success: string; error: string },
        opts?: { success?: Opts; error?: Opts }
    ) {
        return toast.promise(p, {
            loading: messages.loading,
            success: () => ({ message: messages.success, duration: DEFAULTS.success, ...(opts?.success ?? {}) }),
            error: (e: unknown) => ({
                message: messages.error,
                description: e instanceof Error ? e.message : String(e),
                duration: DEFAULTS.error,
                ...(opts?.error ?? {}),
            }),
        });
    },
} as const;
