<script setup lang="ts">
import { ref, computed, watch } from "vue";

import type { ControlDeckControlView, ControlInteraction } from "../../types";

defineOptions({ name: "FirebotSwitchControl" });

const props = defineProps<{
    control: ControlDeckControlView;
}>();

const emit = defineEmits<{
    interact: [interaction: ControlInteraction];
}>();

const on = ref(props.control.state === true);

// Keep in sync when the store emits a new state
watch(() => props.control.state, (newState) => {
    on.value = newState === true;
});

const isVertical = computed(() => props.control.resolvedSettings?.orientation === "vertical");
const onColor = computed(() => (props.control.resolvedSettings?.color as string) || "#41c98a");

const trackStyle = computed(() => (on.value ? { backgroundColor: onColor.value } : {}));

const toggle = (): void => {
    const next = !on.value;
    // Optimistic update
    on.value = next;
    const interaction: ControlInteraction = { action: "toggle", data: next };
    emit("interact", interaction);
};
</script>

<template>
    <button class="deck-control-hit" @click="toggle">
        <div class="deck-control-inner">
            <div
                class="deck-switch"
                :class="{ vertical: isVertical, on: on }"
            >
                <div class="deck-switch-track" :style="trackStyle">
                    <div class="deck-switch-knob"></div>
                </div>
            </div>
            <control-label :control="control"></control-label>
        </div>
    </button>
</template>

<style scoped>
.deck-switch {
    --switch-track-w: 90cqmin;
    --switch-track-h: 48cqmin;
    --switch-pad: 7cqmin;
    --switch-knob: calc(min(var(--switch-track-w), var(--switch-track-h)) - var(--switch-pad) * 2);
    --switch-travel: calc(var(--switch-track-w) - var(--switch-track-h));
    pointer-events: none;
}

.deck-switch.vertical {
    --switch-track-w: 43cqmin;
    --switch-track-h: 83cqmin;
    --switch-travel: calc(var(--switch-track-h) - var(--switch-track-w));
}

.deck-switch-track {
    width: var(--switch-track-w);
    height: var(--switch-track-h);
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.35);
    position: relative;
    transition: background 0.15s ease;
}

.deck-switch-knob {
    position: absolute;
    top: var(--switch-pad);
    left: var(--switch-pad);
    width: var(--switch-knob);
    height: var(--switch-knob);
    border-radius: 50%;
    background: #fff;
    transition: transform 0.15s ease;
}

.deck-switch.on .deck-switch-knob {
    transform: translateX(var(--switch-travel));
}

.deck-switch.vertical .deck-switch-knob {
    transform: translateY(var(--switch-travel));
}

.deck-switch.vertical.on .deck-switch-knob {
    transform: none;
}
</style>
