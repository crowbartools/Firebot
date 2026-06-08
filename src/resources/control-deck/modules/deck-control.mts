import { defineComponent, computed, type PropType } from "vue";

import type { ControlDeckControlView } from "./types.mjs";

export const deckControl = defineComponent({
    props: {
        control: { type: Object as PropType<ControlDeckControlView>, required: true },
    },
    emits: ["press"],
    setup(props, { emit }) {
        const isFolder = computed(() => props.control.type === "folder");
        const style = computed(() => ({
            backgroundColor: props.control.backgroundColor || "#2c3035"
        }));
        const onPress = (): void => emit("press");

        return { isFolder, style, onPress };
    },
    template: /* html */`
        <button
            class="deck-control"
            :class="{ folder: isFolder }"
            :style="style"
            @click="onPress"
        >
            <div class="deck-control-inner">
                <img
                    v-if="control.icon && control.icon.type === 'image'"
                    class="deck-control-icon"
                    :src="control.icon.url"
                    alt=""
                    draggable="false"
                />
                <lucide-icon
                    v-else-if="control.icon && control.icon.type === 'glyph'"
                    class="deck-control-glyph"
                    :name="control.icon.name"
                    :color="control.icon.color"
                    :size="44"
                ></lucide-icon>
                <div v-else-if="isFolder" class="deck-control-folder-glyph">&#128193;</div>
                <div class="deck-control-name">{{ control.name }}</div>
            </div>
        </button>
    `
});
