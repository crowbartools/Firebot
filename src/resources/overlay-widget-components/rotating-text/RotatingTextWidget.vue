<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import type { RotatingTextSettings } from "../../../backend/overlay-widgets/builtin-types/rotating-text/rotating-text.js";
import type { Animation, IOverlayWidgetEventUtils, Trigger } from "../../../types";
import { useWidgetAnimations } from "../_shared/widget-animation.js";

const props = defineProps<{
    store: {
        settings: RotatingTextSettings;
        entryAnimation: Animation | null;
        exitAnimation: Animation | null;
        visible: boolean;
    };
    utils: IOverlayWidgetEventUtils;
}>();

const { onEnter: onWidgetEnter, onLeave: onWidgetLeave } = useWidgetAnimations(
    () => props.store.entryAnimation,
    () => props.store.exitAnimation
);

const { onEnter: onTextEnter, onLeave: onTextLeave } = useWidgetAnimations(
    () => props.store.settings?.textEnterAnimation,
    () => props.store.settings?.textExitAnimation
);

const settings = computed<RotatingTextSettings>(() => props.store.settings ?? ({} as RotatingTextSettings));
const texts = computed<string[]>(() => settings.value.texts ?? []);

const currentIndex = ref(0);
const rawText = computed(() => texts.value[currentIndex.value] ?? "");

const displayText = ref("");
const displayKey = ref(0);
let resolveToken = 0;

async function resolveCurrentText(): Promise<void> {
    const token = ++resolveToken;
    const raw = rawText.value;

    if (!raw) {
        displayText.value = "";
        displayKey.value += 1;
        return;
    }

    let resolved = raw;
    try {
        resolved = await props.utils.invokeFirebotRequest<{ text: string; trigger: Trigger }, string>(
            "eval-replace-vars",
            {
                text: raw,
                trigger: {
                    type: "overlay_widget",
                    metadata: {
                        username: "Firebot"
                    }
                }
            }
        );
    } catch {
        // Fall back to the raw text if evaluation fails.
    }

    // A newer resolution started while we were awaiting - drop this stale result.
    if (token !== resolveToken) {
        return;
    }

    displayText.value = resolved;
    displayKey.value += 1;
}

// Re-evaluate replace variables whenever a new text rotates in (index change) or the
// underlying text at the current index is edited.
watch([currentIndex, rawText], resolveCurrentText, { immediate: true });

let timer: ReturnType<typeof setInterval> | null = null;

function advance(): void {
    const count = texts.value.length;
    if (count <= 1) {
        return;
    }
    if (settings.value.randomizeOrder) {
        // Pick a random index that isn't the current one
        let next = currentIndex.value;
        while (next === currentIndex.value) {
            next = Math.floor(Math.random() * count);
        }
        currentIndex.value = next;
    } else {
        currentIndex.value = (currentIndex.value + 1) % count;
    }
}

function restartTimer(): void {
    if (timer != null) {
        clearInterval(timer);
        timer = null;
    }
    // Keep the index in range if the text list shrank
    if (currentIndex.value >= texts.value.length) {
        currentIndex.value = 0;
    }
    if (texts.value.length <= 1) {
        return;
    }
    const intervalMs = Math.max(1, settings.value.intervalSeconds ?? 5) * 1000;
    timer = setInterval(advance, intervalMs);
}

onMounted(restartTimer);
onUnmounted(() => {
    if (timer != null) {
        clearInterval(timer);
    }
});

watch(
    () => [settings.value.intervalSeconds, settings.value.randomizeOrder],
    restartTimer
);

watch(
    () => settings.value.texts,
    (newTexts, oldTexts) => {
        const list = newTexts ?? [];
        const previousText = (oldTexts ?? [])[currentIndex.value];
        const foundIndex = previousText != null ? list.indexOf(previousText) : -1;

        if (foundIndex !== -1) {
            // Current text is still present, update its index and don't touch the timer.
            currentIndex.value = foundIndex;
            if (list.length > 1 && timer == null) {
                restartTimer();
            } else if (list.length <= 1 && timer != null) {
                clearInterval(timer);
                timer = null;
            }
        } else {
            // Current text was removed or the list was replaced, move to a valid entry and
            // give it a fresh interval.
            if (currentIndex.value >= list.length) {
                currentIndex.value = 0;
            }
            restartTimer();
        }
    },
    { deep: true }
);

const containerStyle = computed(() => {
    const f = settings.value.fontOptions ?? ({} as NonNullable<RotatingTextSettings["fontOptions"]>);
    const h = settings.value.horizontalAlignment;
    const v = settings.value.verticalAlignment;
    return {
        justifyContent: v === "top" ? "flex-start" : v === "bottom" ? "flex-end" : "center",
        alignItems: h === "left" ? "flex-start" : h === "right" ? "flex-end" : "center",
        background: settings.value.backgroundColor ?? "transparent",
        borderRadius: `${settings.value.backgroundBorderRadius ?? 0}px`,
        fontFamily: f.family ? `'${f.family}', Inter, sans-serif` : "Inter, sans-serif",
        fontWeight: String(f.weight ?? 600),
        fontSize: `${f.size ?? 24}px`,
        fontStyle: f.italic ? "italic" : "normal",
        color: f.color ?? "#FFFFFF",
        textAlign: h ?? "center",
        textShadow: settings.value.addDropShadow ? "2px 1px 3px rgb(2 2 2 / 33%)" : "none"
    };
});
</script>

<template>
    <transition appear :css="false" @enter="onWidgetEnter" @leave="onWidgetLeave">
        <div v-if="store.visible" class="rotating-text-widget" :style="containerStyle">
            <transition :css="false" mode="out-in" @enter="onTextEnter" @leave="onTextLeave">
                <div v-if="displayText" :key="displayKey" class="rotating-text-item">
                    {{ displayText }}
                </div>
            </transition>
        </div>
    </transition>
</template>

<style scoped>
.rotating-text-widget {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.rotating-text-item {
    width: 100%;
    white-space: pre-line;
    word-wrap: break-word;
}
</style>
