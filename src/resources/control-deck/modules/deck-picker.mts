import { defineComponent, type PropType } from "vue";

import type { DeckSummary } from "./types.mjs";

export const deckPicker = defineComponent({
    props: {
        decks: { type: Array as PropType<DeckSummary[]>, default: () => [] }
    },
    emits: ["select"],
    setup(_props, { emit }) {
        const select = (deckId: string): void => emit("select", deckId);
        return { select };
    },
    template: /* html */`
        <div class="deck-picker">
            <h1 class="deck-picker-title">Control Decks</h1>
            <div v-if="decks.length === 0" class="centered-message">
                <p>No control decks have been created yet.</p>
            </div>
            <div v-else class="deck-picker-list">
                <button
                    v-for="deck in decks"
                    :key="deck.id"
                    class="deck-picker-item"
                    @click="select(deck.id)"
                >
                    {{ deck.name }}
                </button>
            </div>
        </div>
    `
});
