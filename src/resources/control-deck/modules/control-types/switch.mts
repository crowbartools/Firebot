import { defineComponent, ref, computed, watch, type PropType } from "vue";

import type { ControlDeckControlView, ControlInteraction } from "../types.mjs";

export default defineComponent({
    name: "FirebotSwitchControl",
    props: {
        control: { type: Object as PropType<ControlDeckControlView>, required: true }
    },
    emits: ["interact"],
    setup(props, { emit }) {
        const on = ref(props.control.state === true);

        // Keep in sync when the store broadcasts a new state
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

        return { on, isVertical, trackStyle, toggle };
    },
    template: /* html */`
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
    `
});
