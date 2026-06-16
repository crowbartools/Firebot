<script setup lang="ts">
import { computed, ref, onUnmounted } from "vue";
import { Trophy } from "@lucide/vue";
import { Motion } from "motion-v";
import type { PredictionSettings, PredictionState } from "../../../backend/overlay-widgets/builtin-types/twitch-prediction/twitch-prediction.js";
import type { Animation, ChannelPrediction } from "../../../types";
import { useWidgetAnimations } from "../_shared/widget-animation.js";

type PredictionOutcome = ChannelPrediction["outcomes"][number];

const COLOR_HEX: Record<string, string> = { blue: "#387AFF", pink: "#F5009B" };
const PALETTE = ["#387AFF", "#F5009B", "#00C7AC", "#FFB300", "#9147FF", "#FF6B6B", "#21D07A", "#E0E0E0"];

const props = defineProps<{
    store: {
        settings: PredictionSettings;
        state: PredictionState;
        entryAnimation: Animation | null;
        exitAnimation: Animation | null;
    };
}>();

const { onEnter, onLeave } = useWidgetAnimations(
    () => props.store.entryAnimation,
    () => props.store.exitAnimation
);

const prediction = computed<ChannelPrediction | null>(() => props.store.state?.prediction ?? null);
const settings = computed<PredictionSettings>(() => props.store.settings ?? {} as PredictionSettings);

const timeBarColor = computed(() => settings.value.timeBarColor ?? "#FFFFFF");

const now = ref(Date.now());
const clock = setInterval(() => {
    now.value = Date.now();
}, 250);
onUnmounted(() => clearInterval(clock));

const showTimeBar = computed(() => prediction.value?.status === "active");
const timeRemainingFraction = computed(() => {
    const p = prediction.value;
    if (!p || p.status !== "active") {
        return 0;
    }
    const start = new Date(p.startDate).getTime();
    const end = new Date(p.lockDate).getTime();
    const total = end - start;
    if (!Number.isFinite(total) || total <= 0) {
        return 0;
    }
    return Math.max(0, Math.min(1, (end - now.value) / total));
});

const totalPoints = computed(() => prediction.value?.outcomes.reduce((sum, o) => sum + o.channelPoints, 0) ?? 0);

const statusLabel = computed(() => {
    switch (prediction.value?.status) {
        case "locked": return "Locked";
        case "resolved": return "Ended";
        case "canceled": return "Canceled";
        default: return "Open";
    }
});

function outcomeColor(outcome: PredictionOutcome, index: number): string {
    if (outcome.color) {
        return COLOR_HEX[outcome.color] ?? outcome.color;
    }
    return PALETTE[index % PALETTE.length];
}

function pct(points: number): number {
    const total = totalPoints.value;
    return total > 0 ? Math.round((points / total) * 100) : 0;
}

function isWinner(outcome: PredictionOutcome): boolean {
    const p = prediction.value;
    return !!p && p.status === "resolved" && p.winningOutcomeId === outcome.id;
}

function isLoser(outcome: PredictionOutcome): boolean {
    const p = prediction.value;
    return !!p && p.status === "resolved" && p.winningOutcomeId != null && p.winningOutcomeId !== outcome.id;
}

function formatPoints(points: number): string {
    if (points >= 1000) {
        return `${(points / 1000).toFixed(points >= 10000 ? 0 : 1)}K`;
    }
    return String(points);
}

const fontStyle = computed(() => {
    const f = settings.value.fontOptions ?? {} as NonNullable<PredictionSettings["fontOptions"]>;
    return {
        fontFamily: f.family ? `'${f.family}', Inter, sans-serif` : "Inter, sans-serif",
        fontWeight: String(f.weight ?? 600),
        fontSize: `${f.size ?? 20}px`,
        fontStyle: f.italic ? "italic" : "normal",
        color: f.color ?? "#FFFFFF"
    };
});

const panelStyle = computed(() => ({
    background: settings.value.backgroundColor ?? "#18181B"
}));
</script>

<template>
    <transition :css="false" @enter="onEnter" @leave="onLeave">
        <div v-if="prediction" class="prediction-widget" :style="[fontStyle, panelStyle]">
            <div class="prediction-header">
                <span class="prediction-title">{{ prediction.title }}</span>
                <span class="prediction-status" :class="prediction.status">{{ statusLabel }}</span>
            </div>
            <div class="prediction-outcomes">
                <div
                    v-for="(outcome, index) in prediction.outcomes"
                    :key="outcome.id"
                    class="prediction-outcome"
                    :class="{ winner: isWinner(outcome), loser: isLoser(outcome) }"
                >
                    <div class="prediction-outcome-row">
                        <span class="prediction-outcome-title">
                            <Motion
                                v-if="isWinner(outcome)"
                                as="span"
                                class="prediction-winner-icon"
                                :initial="{ scale: 0, rotate: -30 }"
                                :animate="{ scale: 1, rotate: [0, -12, 12, -7, 7, 0] }"
                                :transition="{
                                    scale: { type: 'spring', stiffness: 500, damping: 12 },
                                    rotate: { duration: 0.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 2 }
                                }"
                            >
                                <Trophy />
                            </Motion>
                            <span class="prediction-dot" :style="{ background: outcomeColor(outcome, index) }"></span>
                            {{ outcome.title }}
                        </span>
                        <span class="prediction-outcome-meta">
                            <span>{{ pct(outcome.channelPoints) }}%</span>
                            <span class="prediction-points">{{ formatPoints(outcome.channelPoints) }}</span>
                            <span v-if="settings.showUsers !== false" class="prediction-users">{{ outcome.users }} 👤</span>
                        </span>
                    </div>
                    <div class="prediction-bar-track">
                        <div
                            class="prediction-bar-fill"
                            :style="{ width: pct(outcome.channelPoints) + '%', background: outcomeColor(outcome, index) }"
                        ></div>
                    </div>
                </div>
            </div>
            <div v-if="showTimeBar" class="prediction-time-track">
                <div
                    class="prediction-time-fill"
                    :style="{ width: timeRemainingFraction * 100 + '%', background: timeBarColor }"
                ></div>
            </div>
        </div>
    </transition>
</template>

<style scoped>
.prediction-widget {
    box-sizing: border-box;
    width: 100%;
    padding: 14px 16px 16px 16px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow: hidden;
}

.prediction-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
}

.prediction-title {
    font-size: 1.15em;
    font-weight: 700;
}

.prediction-status {
    flex-shrink: 0;
    font-size: 0.65em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgb(145 71 255);
}

.prediction-status.locked {
    background: rgba(255, 179, 0, 0.50);
}

.prediction-status.resolved {
    background: rgba(0, 199, 60, 0.50);
}

.prediction-status.canceled {
    background: rgba(255, 107, 107, 0.50);
}

.prediction-outcomes {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.prediction-outcome {
    display: flex;
    flex-direction: column;
    gap: 3px;
    transition: opacity 0.3s ease;
}

.prediction-outcome.loser {
    opacity: 0.45;
}

.prediction-outcome-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 0.9em;
}

.prediction-outcome-title {
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 8px;
}

.prediction-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex-shrink: 0;
}

.prediction-outcome-meta {
    display: flex;
    gap: 8px;
    opacity: 0.85;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
}

.prediction-users {
    opacity: 0.7;
}

.prediction-bar-track {
    width: 100%;
    height: 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.12);
    overflow: hidden;
}

.prediction-bar-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.5s ease;
    min-width: 2px;
}

.prediction-outcome.winner .prediction-outcome-title {
    font-weight: 700;
}

.prediction-winner-icon {
    display: inline-flex;
    align-items: center;
    color: #FFC83D;
    flex-shrink: 0;
}

.prediction-winner-icon svg {
    width: 1em;
    height: 1em;
}

.prediction-outcome.winner .prediction-bar-fill {
    box-shadow: 0 0 8px currentColor;
    filter: brightness(1.15);
}

.prediction-time-track {
    margin: 6px -16px -16px -16px;
    height: 5px;
    background: rgba(255, 255, 255, 0.12);
    overflow: hidden;
}

.prediction-time-fill {
    height: 100%;
    transition: width 0.25s linear;
}
</style>
