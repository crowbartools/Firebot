import { defineComponent, type PropType } from "vue";

import type { ControlDeckControlView, ControlInteraction } from "../types.mjs";

export default defineComponent({
    name: "FirebotFolderControl",
    props: {
        control: { type: Object as PropType<ControlDeckControlView>, required: true }
    },
    emits: ["interact"],
    setup(props, { emit }) {
        const onOpen = (): void => {
            const interaction: ControlInteraction = { action: "open", data: null };
            emit("interact", interaction);
        };
        return { onOpen };
    },
    template: /* html */`
        <button class="deck-control-hit" @click="onOpen">
            <div class="deck-control-inner">
                <control-icon :icon="control.icon" :scale="control.iconSize || 100"></control-icon>
                <control-label :control="control"></control-label>
            </div>
        </button>
    `
});
