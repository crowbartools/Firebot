// Keeps the device screen awake using the vendored NoSleep.js UMD build.
//
// NoSleep requires a user gesture to start (browsers won't let a page hold a
// wake lock without interaction), so `enable()` must be called from within a
// click/touch handler. We auto-arm on the first interaction and also expose a
// manual toggle for the header indicator.

interface NoSleepInstance {
    enable: () => Promise<void> | void;
    disable: () => void;
}

declare global {
    interface Window {
        NoSleep?: new () => NoSleepInstance;
    }
}

let instance: NoSleepInstance | null = null;
let active = false;

function getInstance(): NoSleepInstance | null {
    if (instance) {
        return instance;
    }
    if (typeof window.NoSleep !== "function") {
        return null;
    }
    instance = new window.NoSleep();
    return instance;
}

export function isWakeLockActive(): boolean {
    return active;
}

export async function enableWakeLock(): Promise<boolean> {
    const ns = getInstance();
    if (!ns) {
        return false;
    }
    try {
        await ns.enable();
        active = true;
    } catch {
        active = false;
    }
    return active;
}

export function disableWakeLock(): void {
    const ns = getInstance();
    if (!ns) {
        return;
    }
    try {
        ns.disable();
    } catch {
        // ignore
    }
    active = false;
}

/**
 * Arms the wake lock on the first user interaction (required by browsers) and
 * invokes `onChange` whenever the active state changes. Returns a cleanup fn.
 */
export function setupWakeLock(onChange: (active: boolean) => void): () => void {
    let armed = false;

    const arm = (): void => {
        if (armed) {
            return;
        }
        armed = true;
        void enableWakeLock().then((ok) => {
            onChange(ok);
        });
    };

    const onFirstInteraction = (): void => {
        arm();
        window.removeEventListener("pointerdown", onFirstInteraction);
        window.removeEventListener("keydown", onFirstInteraction);
    };

    window.addEventListener("pointerdown", onFirstInteraction);
    window.addEventListener("keydown", onFirstInteraction);

    // Re-assert the lock when returning to the page (mobile browsers drop it on
    // background/visibility change).
    const onVisibility = (): void => {
        if (document.visibilityState === "visible" && armed && active) {
            void enableWakeLock();
        }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
        window.removeEventListener("pointerdown", onFirstInteraction);
        window.removeEventListener("keydown", onFirstInteraction);
        document.removeEventListener("visibilitychange", onVisibility);
    };
}

/** Toggles the wake lock from within a user-gesture handler. */
export async function toggleWakeLock(): Promise<boolean> {
    if (active) {
        disableWakeLock();
        return false;
    }
    return enableWakeLock();
}
