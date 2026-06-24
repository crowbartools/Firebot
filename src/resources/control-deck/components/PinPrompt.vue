<script setup lang="ts">
import { ref } from "vue";

defineProps<{
    error?: string;
}>();

const emit = defineEmits<{
    submit: [pin: string];
}>();

const pin = ref("");

const submit = (): void => {
    if (pin.value.length > 0) {
        emit("submit", pin.value);
    }
};
</script>

<template>
    <div class="pin-prompt">
        <div class="pin-card">
            <h2>Enter PIN</h2>
            <p class="pin-subtitle">This Control Deck is protected.</p>
            <input
                class="pin-input"
                type="password"
                inputmode="numeric"
                autocomplete="off"
                v-model="pin"
                @keyup.enter="submit"
                placeholder="PIN"
            />
            <div v-if="error" class="pin-error">{{ error }}</div>
            <button class="pin-submit" @click="submit">Unlock</button>
        </div>
    </div>
</template>

<style scoped>
.pin-prompt {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
}

.pin-card {
    background: var(--surface);
    border-radius: 16px;
    padding: 28px;
    width: 100%;
    max-width: 360px;
    text-align: center;
}

.pin-subtitle {
    color: var(--text-dim);
    margin-top: 4px;
}

.pin-input {
    width: 100%;
    margin-top: 16px;
    padding: 14px;
    font-size: 1.3rem;
    text-align: center;
    letter-spacing: 0.3em;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: var(--surface-2);
    color: var(--text);
}

.pin-error {
    color: var(--danger);
    margin-top: 10px;
    font-size: 0.9rem;
}

.pin-submit {
    width: 100%;
    margin-top: 16px;
    padding: 14px;
    font-size: 1.05rem;
    font-weight: 700;
    border: none;
    border-radius: 10px;
    background: var(--accent);
    color: #fff;
    cursor: pointer;
}
</style>
