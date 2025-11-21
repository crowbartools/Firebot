import { Awaitable } from "../../types/util-types";

type AppCloseListener = () => Awaitable<void>;

class AppCloseListenerManager {
    private listeners: Set<AppCloseListener> = new Set();
    constructor() {}

    registerListener(listener: AppCloseListener) {
        this.listeners.add(listener);
    }

    unregisterListener(listener: AppCloseListener) {
        this.listeners.delete(listener);
    }

    async runListeners() {
        // run all listeners in parallel and wait for them to complete
        await Promise.all(Array.from(this.listeners).map(async (listener) => {
            try {
                await listener();
            } catch { /* ignore errors from listeners */ }
        }));
    }
}

const manager = new AppCloseListenerManager();

export { manager as AppCloseListenerManager };