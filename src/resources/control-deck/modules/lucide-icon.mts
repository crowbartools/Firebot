import { defineComponent } from "vue";

declare global {
    interface Window {
        lucide?: {
            createIcons: (options?: {
                root?: Element;
                nameAttr?: string;
                attrs?: Record<string, unknown>;
            }) => void;
        };
    }
}

export const lucideIcon = defineComponent({
    props: {
        name: { type: String, required: true },
        size: { type: Number, default: 24 },
        strokeWidth: { type: Number, default: 2 },
        color: { type: String, default: "" }
    },
    methods: {
        renderIcon(): void {
            const el = this.$el as HTMLElement;
            if (!el) {
                return;
            }
            el.innerHTML = "";
            const placeholder = document.createElement("i");
            placeholder.setAttribute("data-lucide", this.name);
            el.appendChild(placeholder);
            const attrs: Record<string, unknown> = {
                width: this.size,
                height: this.size,
                "stroke-width": this.strokeWidth
            };
            if (this.color) {
                attrs.stroke = this.color;
            }
            window.lucide?.createIcons({
                root: el,
                attrs
            });
        }
    },
    mounted() {
        this.renderIcon();
    },
    updated() {
        this.renderIcon();
    },
    template: /* html */`<span class="lucide-icon" :data-icon="name"></span>`
});
