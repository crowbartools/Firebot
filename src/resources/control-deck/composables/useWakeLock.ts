import { onMounted, onUnmounted, readonly, ref } from "vue";
import NoSleep from "nosleep.js";

export function useWakeLock() {
    const isActive = ref(false);

    let instance: NoSleep | null = null;
    let armed = false;

    function getInstance(): NoSleep {
        if (!instance) {
            instance = new NoSleep();
        }
        return instance;
    }

    async function enable(): Promise<boolean> {
        try {
            await getInstance().enable();
            isActive.value = true;
        } catch {
            isActive.value = false;
        }
        return isActive.value;
    }

    function disable(): void {
        try {
            getInstance().disable();
        } catch {
            // ignore
        }
        isActive.value = false;
    }

    async function toggle(): Promise<boolean> {
        if (isActive.value) {
            disable();
            return false;
        }
        return enable();
    }

    const arm = (): void => {
        if (armed) {
            return;
        }
        armed = true;
        void enable();
    };

    const onFirstInteraction = (): void => {
        arm();
        window.removeEventListener("pointerdown", onFirstInteraction);
        window.removeEventListener("keydown", onFirstInteraction);
    };

    // recheck the lock when returning to the page
    const onVisibility = (): void => {
        if (document.visibilityState === "visible" && armed && isActive.value) {
            void enable();
        }
    };

    onMounted(() => {
        window.addEventListener("pointerdown", onFirstInteraction);
        window.addEventListener("keydown", onFirstInteraction);
        document.addEventListener("visibilitychange", onVisibility);
    });

    onUnmounted(() => {
        window.removeEventListener("pointerdown", onFirstInteraction);
        window.removeEventListener("keydown", onFirstInteraction);
        document.removeEventListener("visibilitychange", onVisibility);
    });

    return {
        isActive: readonly(isActive),
        enable,
        disable,
        toggle
    };
}
