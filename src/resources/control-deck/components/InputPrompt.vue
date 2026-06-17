<script setup lang="ts">
import { ref, reactive, computed } from "vue";

import type { ControlDeckControlInput, ControlInputValues } from "../types";

const props = withDefaults(defineProps<{
    controlName?: string;
    inputs: ControlDeckControlInput[];
}>(), {
    controlName: ""
});

const emit = defineEmits<{
    submit: [values: ControlInputValues];
    cancel: [];
}>();

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
</script>

<template>
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
</template>

<style scoped>
.input-prompt-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 100;
}

.input-prompt-card {
    background: var(--surface);
    border-radius: 16px;
    padding: 22px;
    width: 100%;
    max-width: 420px;
    max-height: 85vh;
    max-height: 85dvh;
    overflow-y: auto;
}

.input-prompt-title {
    margin: 0 0 14px 0;
    font-size: 1.15rem;
}

.input-field {
    margin-bottom: 16px;
}

.input-field-label {
    display: block;
    font-weight: 600;
    margin-bottom: 4px;
}

.input-field-desc {
    color: var(--text-dim);
    font-size: 0.85rem;
    margin: 0 0 6px 0;
}

.input-field-control {
    width: 100%;
    padding: 12px;
    font-size: 1rem;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: var(--surface-2);
    color: var(--text);
}

select.input-field-control {
    appearance: none;
    -webkit-appearance: none;
    cursor: pointer;
}

.input-select-wrap {
    position: relative;
}

/* Toggle switch */
.input-toggle {
    position: relative;
    width: 56px;
    height: 32px;
    border: none;
    border-radius: 999px;
    background: var(--surface-2);
    cursor: pointer;
    transition: background 0.15s ease;
    padding: 0;
}

.input-toggle.on {
    background: var(--good);
}

.input-toggle-knob {
    position: absolute;
    top: 4px;
    left: 4px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.15s ease;
}

.input-toggle.on .input-toggle-knob {
    transform: translateX(24px);
}

.input-prompt-error {
    color: var(--danger);
    font-size: 0.9rem;
    margin-bottom: 10px;
}

.input-prompt-actions {
    display: flex;
    gap: 10px;
    margin-top: 6px;
}

.input-prompt-btn {
    flex: 1;
    padding: 13px;
    font-size: 1rem;
    font-weight: 700;
    border: none;
    border-radius: 10px;
    cursor: pointer;
}

.input-prompt-btn.cancel {
    background: var(--surface-2);
    color: var(--text);
}

.input-prompt-btn.confirm {
    background: var(--accent);
    color: #fff;
}

.input-prompt-btn.confirm:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}
</style>
