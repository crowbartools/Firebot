import { defineComponent, ref, reactive, computed, type PropType } from "vue";

import type { ControlDeckControlInput, ControlInputValues } from "./types.mjs";

export const inputPrompt = defineComponent({
    props: {
        controlName: { type: String, default: "" },
        inputs: { type: Array as PropType<ControlDeckControlInput[]>, required: true }
    },
    emits: ["submit", "cancel"],
    setup(props, { emit }) {
        const values = reactive<Record<string, string | number | boolean>>({});

        // Initialize defaults per input type
        for (const input of props.inputs) {
            if (input.type === "toggle") {
                values[input.name] = false;
            } else if (input.type === "preset") {
                values[input.name] = input.options?.[0] ?? "";
            } else {
                values[input.name] = "";
            }
        }

        const canSubmit = computed(() => {
            return props.inputs.every((input) => {
                const value = values[input.name];
                if (input.type === "toggle") {
                    return true;
                }
                if (input.type === "number") {
                    return value !== "" && !isNaN(Number(value));
                }
                return value != null && String(value).trim() !== "";
            });
        });

        const error = ref("");

        function submit(): void {
            if (!canSubmit.value) {
                error.value = "Please fill in all inputs";
                return;
            }
            const result: ControlInputValues = {};
            for (const input of props.inputs) {
                const raw = values[input.name];
                if (input.type === "number") {
                    result[input.name] = Number(raw);
                } else if (input.type === "toggle") {
                    result[input.name] = raw === true;
                } else {
                    result[input.name] = String(raw);
                }
            }
            emit("submit", result);
        }

        function cancel(): void {
            emit("cancel");
        }

        function toggle(input: ControlDeckControlInput): void {
            values[input.name] = values[input.name] !== true;
        }

        return {
            values,
            canSubmit,
            error,
            submit,
            cancel,
            toggle
        };
    },
    template: /* html */`
        <div class="input-prompt-overlay" @click.self="cancel">
            <div class="input-prompt-card">
                <h3 class="input-prompt-title">{{ controlName }}</h3>

                <div v-for="input in inputs" :key="input.name" class="input-field">
                    <label class="input-field-label">{{ input.name }}</label>
                    <p v-if="input.description" class="input-field-desc">{{ input.description }}</p>

                    <input
                        v-if="input.type === 'text'"
                        class="input-field-control"
                        type="text"
                        v-model="values[input.name]"
                        autocomplete="off"
                        placeholder="Enter text"
                    />

                    <input
                        v-else-if="input.type === 'number'"
                        class="input-field-control"
                        type="number"
                        inputmode="decimal"
                        v-model="values[input.name]"
                        autocomplete="off"
                        placeholder="Enter number"
                    />

                    <button
                        v-else-if="input.type === 'toggle'"
                        type="button"
                        class="input-toggle"
                        :class="{ on: values[input.name] === true }"
                        role="switch"
                        :aria-checked="values[input.name] === true"
                        @click="toggle(input)"
                    >
                        <span class="input-toggle-knob"></span>
                    </button>

                    <div v-else-if="input.type === 'preset'" class="input-select-wrap">
                        <select class="input-field-control" v-model="values[input.name]">
                            <option v-for="option in input.options" :key="option" :value="option">{{ option }}</option>
                        </select>
                    </div>
                </div>

                <div v-if="error" class="input-prompt-error">{{ error }}</div>

                <div class="input-prompt-actions">
                    <button type="button" class="input-prompt-btn cancel" @click="cancel">Cancel</button>
                    <button type="button" class="input-prompt-btn confirm" :disabled="!canSubmit" @click="submit">Submit</button>
                </div>
            </div>
        </div>
    `
});
