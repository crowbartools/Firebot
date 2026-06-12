import { defineComponent, computed, type Component, type PropType } from "vue";

import { FOLDER_CONTROL_TYPE_ID } from "./control-types/index.mjs";
import { usePressed } from "./use-pressed.mjs";
import type { ControlDeckControlView, ControlInteraction } from "./types.mjs";


// Thin shell for a control on the deck grid: renders the control's background
// and hosts the control type's component, which owns the content + gestures.
export const deckControl = defineComponent({
    props: {
        control: { type: Object as PropType<ControlDeckControlView>, required: true },
        typeComponent: { type: Object as PropType<Component | null>, default: null }
    },
    emits: ["interact"],
    setup(props, { emit }) {
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

        return { isFolder, style, onInteract, pressed, pressedHandlers };
    },
    template: /* html */`
        <div
            class="deck-control"
            :class="{ folder: isFolder, unknown: !typeComponent, pressed, [\`shell-\${control.shell}\`]: true }"
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
                    :size="32"
                ></lucide-icon>
                <div class="deck-control-name">{{ control.name }}</div>
            </div>
        </div>
    `
});
