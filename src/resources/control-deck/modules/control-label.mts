import { defineComponent, computed, type PropType } from "vue";

import type { ControlDeckControlView } from "./types.mjs";

/**
 * Renders a control's optional label with its configured font
 */
export const controlLabel = defineComponent({
    props: {
        control: { type: Object as PropType<ControlDeckControlView>, required: true }
    },
    setup(props) {
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
        return { style };
    },
    template: /* html */`
        <div v-if="control.label" class="deck-control-name" :style="style">{{ control.label }}</div>
    `
});
