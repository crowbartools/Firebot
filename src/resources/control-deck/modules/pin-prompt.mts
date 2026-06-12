import { defineComponent, ref } from "vue";

export const pinPrompt = defineComponent({
    props: {
        error: { type: String, default: "" }
    },
    emits: ["submit"],
    setup(_props, { emit }) {
        const pin = ref("");

        const submit = (): void => {
            if (pin.value.length > 0) {
                emit("submit", pin.value);
            }
        };

        return { pin, submit };
    },
    template: /* html */`
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
    `
});
