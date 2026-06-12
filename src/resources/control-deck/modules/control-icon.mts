import { defineComponent, computed, type PropType } from "vue";

import type { ControlDeckResolvedIcon } from "./types.mjs";

/**
 * Renders a control's resolved icon (image, glyph, or emoji) */
export const controlIcon = defineComponent({
    props: {
        icon: { type: Object as PropType<ControlDeckResolvedIcon | null>, default: null },
        size: { type: Number, default: 50 },
        scale: { type: Number, default: 100 }
    },
    setup(props) {
        const factor = computed(() => Math.max(props.scale, 1) / 100);
        const glyphSize = computed(() => Math.round(props.size * factor.value));
        const imageStyle = computed(() => ({
            width: `${50 * factor.value}%`,
            maxWidth: `${Math.round(75 * factor.value)}px`,
            maxHeight: `${Math.round(75 * factor.value)}px`
        }));
        const emojiStyle = computed(() => ({
            fontSize: `${(3 * factor.value).toFixed(3)}rem`
        }));
        return { glyphSize, imageStyle, emojiStyle };
    },
    template: /* html */`
        <img
            v-if="icon && icon.type === 'image'"
            class="deck-control-icon"
            :src="icon.url"
            :style="imageStyle"
            alt=""
            draggable="false"
        />
        <lucide-icon
            v-else-if="icon && icon.type === 'glyph'"
            class="deck-control-glyph"
            :name="icon.name"
            :color="icon.color"
            :size="glyphSize"
        ></lucide-icon>
        <span
            v-else-if="icon && icon.type === 'emoji'"
            class="deck-control-emoji"
            :style="emojiStyle"
        >{{ icon.emoji }}</span>
    `
});
