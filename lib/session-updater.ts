/* eslint-disable @typescript-eslint/no-explicit-any */

// Simple in-memory setter/getter for a client-side session updater
type Updater = (data: Partial<{ accessToken: string; refreshToken: string }>) => Promise<any> | void;

let updater: Updater | null = null;

export function setSessionUpdater(fn: Updater) {
    updater = fn;
}

export function getSessionUpdater(): Updater | null {
    return updater;
}
