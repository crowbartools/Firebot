<script setup lang="ts">
import type { ControlDeckControlView, ControlInteraction } from "../../types";

defineOptions({ name: "FirebotButtonControl" });

defineProps<{
    control: ControlDeckControlView;
}>();

const emit = defineEmits<{
    interact: [interaction: ControlInteraction];
}>();

const onPress = (): void => {
    const interaction: ControlInteraction = { action: "press", data: null };
    emit("interact", interaction);
};
</script>

<template>
    <button class="deck-control-hit" @click="onPress">
        <div class="deck-control-inner">
            <control-icon :icon="control.icon" :scale="control.iconSize || 100"></control-icon>
            <control-label :control="control"></control-label>
        </div>
    </button>
</template>
