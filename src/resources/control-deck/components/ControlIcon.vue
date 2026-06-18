<script setup lang="ts">
import { computed } from "vue";

import type { ControlDeckResolvedIcon } from "../types";

/**
 * Renders a control's resolved icon (image, glyph, or emoji)
 */
const props = withDefaults(defineProps<{
    icon?: ControlDeckResolvedIcon | null;
    scale?: number;
}>(), {
    icon: null,
    scale: 100
});

const factor = computed(() => Math.max(props.scale, 1) / 100);
const glyphStyle = computed(() => ({
    width: `${(40 * factor.value).toFixed(2)}cqmin`,
    height: `${(40 * factor.value).toFixed(2)}cqmin`
}));
const imageStyle = computed(() => ({
    width: `${(50 * factor.value).toFixed(2)}cqmin`,
    maxHeight: `${(60 * factor.value).toFixed(2)}cqmin`
}));
const emojiStyle = computed(() => ({
    fontSize: `${(40 * factor.value).toFixed(2)}cqmin`
}));
</script>

<template>
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
        :style="glyphStyle"
    ></lucide-icon>
    <span
        v-else-if="icon && icon.type === 'emoji'"
        class="deck-control-emoji"
        :style="emojiStyle"
    >{{ icon.emoji }}</span>
</template>
