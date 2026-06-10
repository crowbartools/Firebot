import { createApp, defineComponent, ref, computed, onMounted } from "vue";

import { deckControl } from "./modules/deck-control.mjs";
import { deckPicker } from "./modules/deck-picker.mjs";
import { pinPrompt } from "./modules/pin-prompt.mjs";
import { inputPrompt } from "./modules/input-prompt.mjs";
import { lucideIcon } from "./modules/lucide-icon.mjs";
import {
    ApiError,
    fetchControlDeckSettings,
    fetchDecks,
    fetchDeck,
    pressControl as apiPressControl,
    connectWebSocket,
    getStoredPin,
    setStoredPin
} from "./modules/api.mjs";
import { setupWakeLock, toggleWakeLock } from "./modules/wake-lock.mjs";
import type {
    ControlDeckControlView,
    ControlDeckView,
    ControlDeckPage,
    ControlInputValues,
    DeckSummary,
    GridDims,
    PlacedControl
} from "./modules/types.mjs";

function deckParam(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get("deck");
}

// Must match CONTROL_DECK_PINNED_PAGE_ID in src/types/control-deck.ts
const PINNED_PAGE_ID = "pinned";

const rootComponent = defineComponent({
    setup() {
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
        const wakeLockActive = ref(false);
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

        // The grid dimensions actually rendered (swapped when rotated).
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

        // Pinned controls merge only at page root (not inside folders).
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

            // Does a w×h rectangle anchored at (col,row) fit within bounds and free cells?
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

            const mark = (col: number, row: number, w: number, h: number): void => {
                for (let r = row; r < row + h; r++) {
                    for (let c = col; c < col + w; c++) {
                        occupied.add(`${c}:${r}`);
                    }
                }
            };

            // First pass: place controls with explicit positions that still fit
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

            // Find the first free top-left cell where a w×h rectangle fits
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

            // Second pass: auto-flow remaining controls; shrink to 1x1 if needed
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
            // is still free (i.e. not occluded by a page control on top).
            for (const control of pinnedLevelControls.value) {
                const { w, h } = sizeOf(control);
                const pos = control.position;
                if (pos && fits(pos.col, pos.row, w, h)) {
                    mark(pos.col, pos.row, w, h);
                    result.push({ control, col: pos.col, row: pos.row, w, h });
                }
            }

            // When rotated, remap every placement from the natural grid into the
            // display grid with a 90° clockwise rotation. A control at natural
            // (col,row) moves to (rows-(row-1)-h+1, col) and its footprint swaps.
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

        async function toggleWakeLockState(): Promise<void> {
            wakeLockActive.value = await toggleWakeLock();
        }

        function goBack(): void {
            if (folderStack.value.length) {
                folderStack.value.pop();
            } else {
                currentDeckId.value = null;
                currentDeck.value = null;
            }
        }

        async function pressControl(control: ControlDeckControlView): Promise<void> {
            if (control.type === "folder") {
                folderStack.value.push({
                    id: control.id,
                    autoReturn: control.autoReturn
                });
                return;
            }
            // Prompt for inputs before sending the press
            if (control.inputs?.length) {
                inputPromptControl.value = control;
                return;
            }
            await sendPress(control);
        }

        async function sendPress(control: ControlDeckControlView, inputValues?: ControlInputValues): Promise<void> {
            try {
                if (currentDeckId.value) {
                    await apiPressControl(currentDeckId.value, control.id, inputValues);
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

        async function submitControlInputs(inputValues: ControlInputValues): Promise<void> {
            const control = inputPromptControl.value;
            inputPromptControl.value = null;
            if (control) {
                await sendPress(control, inputValues);
            }
        }

        function cancelControlInputs(): void {
            inputPromptControl.value = null;
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
            }
        }

        onMounted(async () => {
            setupWakeLock((isActive) => {
                wakeLockActive.value = isActive;
            });

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

        return {
            initializing,
            decks,
            currentDeckId,
            currentDeck,
            currentPageId,
            pages,
            folderStack,
            connected,
            needsPin,
            disabled,
            pinError,
            wakeLockActive,
            grid,
            gridStyle,
            currentParentId,
            currentFolder,
            placedControls,
            submitPin,
            selectDeck,
            selectPage,
            goBack,
            pressControl,
            inputPromptControl,
            submitControlInputs,
            cancelControlInputs,
            toggleWakeLockState
        };
    }
});

const app = createApp(rootComponent);

app
    .component("DeckControl", deckControl)
    .component("DeckPicker", deckPicker)
    .component("PinPrompt", pinPrompt)
    .component("InputPrompt", inputPrompt)
    .component("LucideIcon", lucideIcon);

app.mount("#app");
