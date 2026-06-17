<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

import { controlTypeRegistry, FOLDER_CONTROL_TYPE_ID } from "./components/control-types/registry";
import {
    ApiError,
    fetchControlDeckSettings,
    fetchDecks,
    fetchDeck,
    interactWithControl,
    connectWebSocket,
    getStoredPin,
    setStoredPin
} from "./services/api";
import { useWakeLock } from "./composables/useWakeLock";
import type {
    ControlDeckControlView,
    ControlDeckView,
    ControlDeckPage,
    ControlInputValues,
    ControlInteraction,
    DeckSummary,
    GridDims,
    PlacedControl
} from "./types";

function deckParam(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get("deck");
}

// Must match CONTROL_DECK_PINNED_PAGE_ID in src/types/control-deck.ts
const PINNED_PAGE_ID = "pinned";

const decks = ref<DeckSummary[]>([]);
const currentDeckId = ref<string | null>(null);
const currentDeck = ref<ControlDeckView | null>(null);
const currentPageId = ref<string | null>(null);
const folderStack = ref<Array<{ id: string; autoReturn?: boolean }>>([]);
const connected = ref(false);
const needsPin = ref(false);
const disabled = ref(false);
const initializing = ref(true);
const pinError = ref("");
const { isActive: wakeLockActive, toggle: toggleWakeLockState } = useWakeLock();
const orientationMode = ref<"fixed" | "dynamic">("dynamic");
const defaultDeckId = ref<string | null>(null);
const viewportLandscape = ref(window.innerWidth >= window.innerHeight);

const grid = computed<GridDims>(() => {
    if (!currentDeck.value) {
        return { cols: 3, rows: 5 };
    }
    return currentDeck.value.grid;
});

// In dynamic mode, rotate the grid when its natural orientation doesn't
// match the device so it fills the screen better
const gridRotated = computed<boolean>(() => {
    if (orientationMode.value !== "dynamic") {
        return false;
    }
    if (grid.value.cols === grid.value.rows) {
        return false;
    }
    const gridLandscape = grid.value.cols > grid.value.rows;
    return gridLandscape !== viewportLandscape.value;
});

const displayGrid = computed<GridDims>(() => {
    if (gridRotated.value) {
        return { cols: grid.value.rows, rows: grid.value.cols };
    }
    return grid.value;
});

const gridStyle = computed(() => ({
    "--cd-cols": String(displayGrid.value.cols),
    "--cd-rows": String(displayGrid.value.rows),
    gridTemplateColumns: `repeat(${displayGrid.value.cols}, 1fr)`,
    gridTemplateRows: `repeat(${displayGrid.value.rows}, 1fr)`
}));

const currentParentId = computed<string | null>(() => {
    return folderStack.value.length
        ? folderStack.value[folderStack.value.length - 1]?.id
        : null;
});

const pages = computed<ControlDeckPage[]>(() => currentDeck.value?.pages ?? []);

const currentFolder = computed<ControlDeckControlView | null>(() => {
    if (!currentParentId.value || !currentDeck.value) {
        return null;
    }
    return currentDeck.value.controls.find(c => c.id === currentParentId.value) || null;
});

const contextPageId = computed<string | null>(() => {
    if (currentParentId.value == null) {
        return currentPageId.value;
    }
    return currentFolder.value?.pageId ?? currentPageId.value;
});

// The page-layer controls at the current level.
const levelControls = computed<ControlDeckControlView[]>(() => {
    if (!currentDeck.value) {
        return [];
    }
    return currentDeck.value.controls.filter(c =>
        c.pageId === contextPageId.value
        && (c.parentId ?? null) === currentParentId.value);
});

// Pinned controls merge only at page root (ie not inside folders)
const pinnedLevelControls = computed<ControlDeckControlView[]>(() => {
    if (!currentDeck.value
        || currentParentId.value != null
        || contextPageId.value === PINNED_PAGE_ID) {
        return [];
    }
    return currentDeck.value.controls.filter(c =>
        c.pageId === PINNED_PAGE_ID && (c.parentId ?? null) === null);
});

const placedControls = computed<PlacedControl[]>(() => {
    const cols = grid.value.cols;
    const rows = grid.value.rows;
    const occupied = new Set<string>();
    const result: PlacedControl[] = [];
    const needsAuto: ControlDeckControlView[] = [];

    const sizeOf = (control: ControlDeckControlView): { w: number; h: number } => ({
        w: Math.max(1, Math.min(control.size?.width ?? 1, cols)),
        h: Math.max(1, Math.min(control.size?.height ?? 1, rows))
    });

    // Does a rectangle fit within bounds and free cells?
    const fits = (col: number, row: number, w: number, h: number): boolean => {
        if (col < 1 || row < 1 || col + w - 1 > cols || row + h - 1 > rows) {
            return false;
        }
        for (let r = row; r < row + h; r++) {
            for (let c = col; c < col + w; c++) {
                if (occupied.has(`${c}:${r}`)) {
                    return false;
                }
            }
        }
        return true;
    };

    // Mark cells as occupied
    const mark = (col: number, row: number, w: number, h: number): void => {
        for (let r = row; r < row + h; r++) {
            for (let c = col; c < col + w; c++) {
                occupied.add(`${c}:${r}`);
            }
        }
    };

    // place controls with explicit positions that still fit
    for (const control of levelControls.value) {
        const { w, h } = sizeOf(control);
        const pos = control.position;
        if (pos && fits(pos.col, pos.row, w, h)) {
            mark(pos.col, pos.row, w, h);
            result.push({ control, col: pos.col, row: pos.row, w, h });
        } else {
            needsAuto.push(control);
        }
    }

    const findFit = (w: number, h: number): { col: number; row: number } | null => {
        for (let row = 1; row <= rows - h + 1; row++) {
            for (let col = 1; col <= cols - w + 1; col++) {
                if (fits(col, row, w, h)) {
                    return { col, row };
                }
            }
        }
        return null;
    };

    // auto-fit remaining controls; shrink to 1x1 if needed
    for (const control of needsAuto) {
        const { w, h } = sizeOf(control);
        let spot = findFit(w, h);
        let ew = w;
        let eh = h;
        if (!spot && (w > 1 || h > 1)) {
            spot = findFit(1, 1);
            ew = 1;
            eh = 1;
        }
        if (spot) {
            mark(spot.col, spot.row, ew, eh);
            result.push({ control, col: spot.col, row: spot.row, w: ew, h: eh });
        }
    }

    // Pinned layer: only render a pinned control where its whole footprint
    // is still free
    for (const control of pinnedLevelControls.value) {
        const { w, h } = sizeOf(control);
        const pos = control.position;
        if (pos && fits(pos.col, pos.row, w, h)) {
            mark(pos.col, pos.row, w, h);
            result.push({ control, col: pos.col, row: pos.row, w, h });
        }
    }

    if (gridRotated.value) {
        return result.map(p => ({
            control: p.control,
            col: rows - (p.row - 1) - p.h + 1,
            row: p.col,
            w: p.h,
            h: p.w
        }));
    }

    return result;
});

async function loadDecks(): Promise<void> {
    decks.value = await fetchDecks();
}

function ensureValidPage(): void {
    const list = currentDeck.value?.pages ?? [];
    if (list.length === 0) {
        currentPageId.value = null;
        return;
    }
    if (!list.some(p => p.id === currentPageId.value)) {
        currentPageId.value = list[0].id;
    }
}

function selectPage(pageId: string): void {
    if (pageId === currentPageId.value) {
        return;
    }
    currentPageId.value = pageId;
    folderStack.value = [];
}

async function selectDeck(deckId: string): Promise<void> {
    try {
        const deck = await fetchDeck(deckId);
        currentDeck.value = deck;
        currentDeckId.value = deckId;
        currentPageId.value = deck.pages?.[0]?.id ?? null;
        folderStack.value = [];
    } catch (err) {
        if (err instanceof ApiError && err.code === 401) {
            needsPin.value = true;
        }
    }
}

async function refreshCurrentDeck(): Promise<void> {
    if (!currentDeckId.value) {
        return;
    }
    try {
        currentDeck.value = await fetchDeck(currentDeckId.value);
        ensureValidPage();
    } catch {
        // deck may have been deleted
        currentDeck.value = null;
        currentDeckId.value = null;
        await loadDecks().catch(() => { /* ignore */ });
    }
}

async function restoreInitialDeck(): Promise<void> {
    const requested = deckParam();
    if (requested) {
        await selectDeck(requested);
    } else if (defaultDeckId.value) {
        await selectDeck(defaultDeckId.value);
    }
}

async function submitPin(pin: string): Promise<void> {
    setStoredPin(pin);
    pinError.value = "";
    try {
        await loadDecks();
        needsPin.value = false;
        await restoreInitialDeck();
    } catch (err) {
        if (err instanceof ApiError && err.code === 401) {
            pinError.value = "Incorrect PIN";
            setStoredPin("");
        } else {
            pinError.value = "Unable to connect";
        }
    }
}

function goBack(): void {
    if (folderStack.value.length) {
        folderStack.value.pop();
    } else {
        currentDeckId.value = null;
        currentDeck.value = null;
    }
}

async function handleControlInteract(
    control: ControlDeckControlView,
    interaction: ControlInteraction
): Promise<void> {
    if (control.type === FOLDER_CONTROL_TYPE_ID && interaction.action === "open") {
        folderStack.value.push({
            id: control.id,
            autoReturn: control.resolvedSettings?.autoReturn === true
        });
        return;
    }

    // Prompt for inputs before sending the interaction
    const shouldPromptInputs = (control.inputs?.length ?? 0) > 0;
    if (shouldPromptInputs) {
        pendingInteraction = interaction;
        inputPromptControl.value = control;
        return;
    }

    await sendInteraction(control, interaction);
}

async function sendInteraction(
    control: ControlDeckControlView,
    interaction: ControlInteraction,
    inputValues?: ControlInputValues
): Promise<void> {
    try {
        if (currentDeckId.value) {
            await interactWithControl(
                currentDeckId.value,
                control.id,
                interaction.action,
                interaction.data,
                inputValues
            );
            const autoReturnFolder = folderStack.value[folderStack.value.length - 1]?.autoReturn;
            if (autoReturnFolder) {
                setTimeout(() => {
                    folderStack.value.pop();
                }, 200);
            }
        }
    } catch (err) {
        if (err instanceof ApiError && err.code === 401) {
            needsPin.value = true;
        }
    }
}

const inputPromptControl = ref<ControlDeckControlView | null>(null);
let pendingInteraction: ControlInteraction | null = null;

async function submitControlInputs(inputValues: ControlInputValues): Promise<void> {
    const control = inputPromptControl.value;
    const interaction = pendingInteraction ?? { action: "press", data: null };
    inputPromptControl.value = null;
    pendingInteraction = null;
    if (control) {
        await sendInteraction(control, interaction, inputValues);
    }
}

function cancelControlInputs(): void {
    inputPromptControl.value = null;
    pendingInteraction = null;
}

function handleWsEvent(name: string, data: unknown): void {
    if (name === "control-deck:deck-updated") {
        const updated = data as ControlDeckView | null;
        if (updated && updated.id === currentDeckId.value) {
            void refreshCurrentDeck();
        }
        void loadDecks().catch(() => { /* ignore */ });
    } else if (name === "control-deck:deck-deleted") {
        if (data === currentDeckId.value) {
            currentDeck.value = null;
            currentDeckId.value = null;
        }
        void loadDecks().catch(() => { /* ignore */ });
    } else if (name === "control-deck:settings-updated") {
        const settings = data as { enabled?: boolean, orientationMode?: "fixed" | "dynamic", defaultDeckId?: string } | null;
        if(settings != null) {
            if (settings.enabled === false) {
                disabled.value = true;
            }
            if (settings.orientationMode != null) {
                orientationMode.value = settings.orientationMode;
            }
            if (settings.defaultDeckId != null) {
                defaultDeckId.value = settings.defaultDeckId;
            }
        }
    } else if (name === "control-deck:set-active-deck") {
        const { deckId, pageId } = data as { deckId: string, pageId?: string };
        if (deckId) {
            currentDeckId.value = deckId;
            currentPageId.value = pageId ?? null;
            void refreshCurrentDeck();
        }
    } else if (name === "control-deck:control-state-updated") {
        const { deckId, controlId, state } = data as { deckId: string, controlId: string, state: unknown };
        if (deckId === currentDeckId.value && currentDeck.value) {
            const control = currentDeck.value.controls.find(c => c.id === controlId);
            if (control) {
                control.state = state;
            }
        }
    }
}

onMounted(async () => {
    const updateOrientation = (): void => {
        viewportLandscape.value = window.innerWidth >= window.innerHeight;
    };
    window.addEventListener("resize", updateOrientation);
    window.addEventListener("orientationchange", updateOrientation);

    try {
        const settings = await fetchControlDeckSettings();
        disabled.value = settings.enabled === false;
        orientationMode.value = settings.orientationMode ?? "dynamic";
        defaultDeckId.value = settings.defaultDeckId ?? null;

        if (settings.pinRequired && !getStoredPin()) {
            needsPin.value = true;
            initializing.value = false;
            return;
        }

        await loadDecks();
        await restoreInitialDeck();
    } catch (err) {
        if (err instanceof ApiError && err.code === 401) {
            needsPin.value = true;
        }
    }

    initializing.value = false;

    connectWebSocket({
        onEvent: (name, data) => handleWsEvent(name, data),
        onStatus: (status) => {
            connected.value = status;
        }
    });
});
</script>

<template>
    <div v-if="initializing" class="centered-message">
        <h2>Loading Control Deck...</h2>
    </div>

    <!-- PIN prompt -->
    <pin-prompt
        v-else-if="needsPin"
        :error="pinError"
        @submit="submitPin"
    ></pin-prompt>

    <!-- Disabled notice -->
    <div v-else-if="disabled" class="centered-message">
        <h2>Control Deck is disabled</h2>
        <p>Enable it in Firebot</p>
    </div>

    <!-- Deck picker -->
    <deck-picker
        v-else-if="!currentDeckId"
        :decks="decks"
        @select="selectDeck"
    ></deck-picker>

    <!-- Deck view -->
    <div v-else class="deck-view">
        <header class="deck-header">
            <button class="header-btn" @click="goBack">
                <lucide-icon :name="folderStack.length ? 'arrow-left' : 'menu'" :size="22"></lucide-icon>
            </button>
            <div class="deck-title">{{ currentDeck?.name }}<span v-if="currentFolder"> / {{ currentFolder.name }}</span></div>
            <div class="page-select-wrap" v-if="pages.length > 1">
                <select
                    class="page-select"
                    :value="currentPageId"
                    @change="selectPage(($event.target as HTMLSelectElement).value)"
                    aria-label="Select page"
                >
                    <option v-for="page in pages" :key="page.id" :value="page.id">{{ page.name }}</option>
                </select>
                <lucide-icon class="page-select-caret" name="chevron-down" :size="16"></lucide-icon>
            </div>
            <!-- <button
                class="wake-indicator"
                :class="{ active: wakeLockActive }"
                @click="toggleWakeLockState"
                :title="wakeLockActive ? 'Screen will stay awake (tap to disable)' : 'Screen may sleep (tap to keep awake)'"
                aria-label="Toggle keep screen awake"
            >
                <lucide-icon name="bed-double" :size="18"></lucide-icon>
                <lucide-icon :name="wakeLockActive ? 'lock' : 'lock-open'" :size="14"></lucide-icon>
            </button> -->
            <div class="conn-indicator" :class="{ connected: connected }" :title="connected ? 'Connected' : 'Disconnected'"></div>
        </header>

        <div class="grid-viewport">
            <div class="grid-sizer">
                <div class="control-grid" :style="gridStyle">
                    <deck-control
                        v-for="cell in placedControls"
                        :key="cell.control.id"
                        :control="cell.control"
                        :type-component="controlTypeRegistry[cell.control.type] ? controlTypeRegistry[cell.control.type].component : null"
                        :style="{ gridColumn: cell.col + ' / span ' + cell.w, gridRow: cell.row + ' / span ' + cell.h }"
                        @interact="handleControlInteract(cell.control, $event)"
                    ></deck-control>
                </div>
            </div>
        </div>

        <input-prompt
            v-if="inputPromptControl"
            :key="inputPromptControl.id"
            :control-name="inputPromptControl.name"
            :inputs="inputPromptControl.inputs"
            @submit="submitControlInputs"
            @cancel="cancelControlInputs"
        ></input-prompt>
    </div>
</template>

<style scoped>
.deck-view {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.deck-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: var(--surface);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.deck-title {
    flex: 1;
    font-weight: 700;
    font-size: 1.05rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.header-btn {
    background: var(--surface-2);
    color: var(--text);
    border: none;
    border-radius: 8px;
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
    cursor: pointer;
}

.conn-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--danger);
    flex: 0 0 auto;
}

.conn-indicator.connected {
    background: var(--good);
}

.wake-indicator {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    height: 36px;
    padding: 0 9px;
    border: none;
    border-radius: 8px;
    background: var(--surface-2);
    color: var(--text-dim);
    cursor: pointer;
}

.wake-indicator.active {
    color: var(--good);
}

/* Page selector (in header) */
.page-select-wrap {
    position: relative;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    max-width: 45%;
}

.page-select {
    appearance: none;
    -webkit-appearance: none;
    background: var(--surface-2);
    color: var(--text);
    border: none;
    border-radius: 8px;
    height: 40px;
    padding: 0 30px 0 14px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    max-width: 100%;
    text-overflow: ellipsis;
}

.page-select:focus {
    outline: 2px solid var(--accent);
    outline-offset: 0;
}

.page-select-caret {
    position: absolute;
    right: 11px;
    color: var(--text-dim);
    pointer-events: none;
}

/* Grid */
.grid-viewport {
    flex: 1;
    display: flex;
    padding: 12px;
    min-height: 0;
    overflow: hidden;
}

.grid-sizer {
    flex: 1;
    min-width: 0;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    container-type: size;
}

.control-grid {
    display: grid;
    gap: 10px;
    aspect-ratio: var(--cd-cols) / var(--cd-rows);
    max-width: 100%;
    width: min(100%, calc(100cqh * var(--cd-cols) / var(--cd-rows)));
}
</style>
