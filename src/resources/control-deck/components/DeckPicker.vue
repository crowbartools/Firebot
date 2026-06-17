<script setup lang="ts">
import type { DeckSummary } from "../types";

withDefaults(defineProps<{
    decks?: DeckSummary[];
}>(), {
    decks: () => []
});

const emit = defineEmits<{
    select: [deckId: string];
}>();

const select = (deckId: string): void => emit("select", deckId);
</script>

<template>
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
</template>

<style scoped>
.deck-picker {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 24px;
    gap: 18px;
    overflow-y: auto;
}

.deck-picker-title {
    text-align: center;
    margin: 12px 0;
}

.deck-picker-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 480px;
    width: 100%;
    margin: 0 auto;
}

.deck-picker-item {
    background: var(--surface-2);
    color: var(--text);
    border: none;
    border-radius: 12px;
    padding: 18px;
    font-size: 1.05rem;
    font-weight: 600;
    cursor: pointer;
    text-align: left;
}

.deck-picker-item:active {
    filter: brightness(1.2);
}
</style>
