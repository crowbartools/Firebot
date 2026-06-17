<script setup lang="ts">
import { computed } from "vue";

import type { ControlDeckControlView } from "../types";

const props = defineProps<{
    control: ControlDeckControlView;
}>();

const style = computed(() => {
    const font = props.control.labelFont;
    const scale = (props.control.labelSize ?? 100) / 100;
    return {
        fontFamily: font?.family || undefined,
        fontWeight: font?.weight || undefined,
        fontStyle: font?.italic ? "italic" : undefined,
        color: font?.color || undefined,
        fontSize: scale !== 1 ? `${(1.0 * scale).toFixed(3)}rem` : undefined
    };
});
</script>

<template>
    <div v-if="control.label" class="deck-control-name" :style="style">{{ control.label }}</div>
</template>
