<script setup lang="ts">
import { computed, type Component } from "vue";
import * as lucideIcons from "@lucide/vue";

// PascalCase -> kebab-case. Mirrors src/gui/app/services/lucide.service.js so the
// glyph names outputted by the icon picker resolve to correct component
const toKebab = (s: string): string => s
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/([a-zA-Z])([0-9])/g, "$1-$2")
    .toLowerCase();

const NON_ICON_EXPORTS = new Set(["icons", "createLucideIcon", "Icon"]);

const iconsByName: Record<string, Component> = {};
for (const [exportName, component] of Object.entries(lucideIcons)) {
    if (NON_ICON_EXPORTS.has(exportName)) {
        continue;
    }
    iconsByName[toKebab(exportName)] = component as Component;
}

const props = withDefaults(defineProps<{
    name: string;
    size?: number;
    strokeWidth?: number;
    color?: string;
}>(), {
    size: 24,
    strokeWidth: 2,
    color: ""
});

const iconComponent = computed<Component | null>(() => iconsByName[props.name] ?? null);
</script>

<template>
    <component
        :is="iconComponent"
        v-if="iconComponent"
        :size="size"
        :stroke-width="strokeWidth"
        :color="color || undefined"
    />
</template>
