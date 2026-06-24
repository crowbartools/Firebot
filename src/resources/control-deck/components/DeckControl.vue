<script setup lang="ts">
import { computed, type Component } from "vue";

import { FOLDER_CONTROL_TYPE_ID } from "./control-types/registry";
import { usePressed } from "../composables/usePressed";
import type { ControlDeckControlView, ControlInteraction } from "../types";

// Shell for a control on the deck grid
const props = withDefaults(defineProps<{
    control: ControlDeckControlView;
    typeComponent?: Component | null;
}>(), {
    typeComponent: null
});

const emit = defineEmits<{
    interact: [interaction: ControlInteraction];
}>();

const isFolder = computed(() => props.control.type === FOLDER_CONTROL_TYPE_ID);

const style = computed(() => {
    const background = props.control.background;
    if (background?.type === "image") {
        return {
            backgroundImage: `url("${background.url.replace(/"/g, '\\"')}")`,
            backgroundSize: "cover",
            backgroundPosition: "center"
        };
    }
    return {
        backgroundColor: background?.type === "color" && background.color
            ? background.color
            : "#2c3035"
    };
});

const onInteract = (interaction: ControlInteraction): void => emit("interact", interaction);

const { pressed, pressedHandlers } = usePressed();
</script>

<template>
    <div
        class="deck-control"
        :class="{ folder: isFolder, unknown: !typeComponent, pressed, [`shell-${control.shell}`]: true }"
        :style="style"
        v-bind="pressedHandlers"
    >
        <component
            v-if="typeComponent"
            :is="typeComponent"
            class="deck-control-component"
            :control="control"
            @interact="onInteract"
        ></component>
        <div v-else class="deck-control-inner">
            <lucide-icon
                class="deck-control-glyph"
                name="alert-triangle"
                color="#f0ad4e"
            ></lucide-icon>
            <div class="deck-control-name">{{ control.name }}</div>
        </div>
    </div>
</template>

<style scoped>
.deck-control {
    border: none;
    border-radius: 5cqmin;
    color: var(--text);
    cursor: pointer;
    padding: 3cqmin;
    overflow: hidden;
    transition: transform 0.06s ease, filter 0.06s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
    min-width: 0;
    min-height: 0;
    container-type: size;
}

.deck-control.shell-none {
    box-shadow: none;
    background: transparent !important;
}

.deck-control:not(.shell-none):active,
.deck-control:not(.shell-none).pressed {
    transform: scale(0.94);
    filter: brightness(1.25);
}

.deck-control.unknown {
    border: 1px dashed rgba(240, 173, 78, 0.6);
    opacity: 0.75;
}
</style>
