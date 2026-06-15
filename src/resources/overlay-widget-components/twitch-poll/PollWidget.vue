<script setup lang="ts">
import { computed, ref, onUnmounted } from "vue";
import type { PollSettings, PollState } from "../../../backend/overlay-widgets/builtin-types/twitch-poll/twitch-poll.js";
import type { Animation, ChannelPoll } from "../../../types";
import { useWidgetAnimations } from "../_shared/widget-animation.js";

const props = defineProps<{
    store: {
        settings: PollSettings;
        state: PollState;
        entryAnimation: Animation | null;
        exitAnimation: Animation | null;
    };
}>();

const { onEnter, onLeave } = useWidgetAnimations(
    () => props.store.entryAnimation,
    () => props.store.exitAnimation
);

const poll = computed<ChannelPoll | null>(() => props.store.state?.poll ?? null);
const settings = computed<PollSettings>(() => props.store.settings ?? {});

const accentColor = computed(() => settings.value.accentColor ?? "#9147FF");
const timeBarColor = computed(() => settings.value.timeBarColor ?? "#FFFFFF");

const now = ref(Date.now());
const clock = setInterval(() => {
    now.value = Date.now();
}, 250);
onUnmounted(() => clearInterval(clock));

const showTimeBar = computed(() => poll.value?.status === "active");
const timeRemainingFraction = computed(() => {
    const p = poll.value;
    if (!p || p.status !== "active") {
        return 0;
    }
    const start = new Date(p.startDate).getTime();
    const end = new Date(p.endDate).getTime();
    const total = end - start;
    if (!Number.isFinite(total) || total <= 0) {
        return 0;
    }
    return Math.max(0, Math.min(1, (end - now.value) / total));
});

const totalVotes = computed(() => poll.value?.choices.reduce((sum, choice) => sum + choice.totalVotes, 0) ?? 0);

function pct(votes: number): number {
    const total = totalVotes.value;
    return total > 0 ? Math.round((votes / total) * 100) : 0;
}

function isWinner(choice: ChannelPoll["choices"][number]): boolean {
    const p = poll.value;
    if (!p || p.status !== "completed") {
        return false;
    }
    return !!p.winningChoiceIds?.includes(choice.id);
}

const fontStyle = computed(() => {
    const f = settings.value.fontOptions ?? {} as NonNullable<PollSettings["fontOptions"]>;
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

const statusLabel = computed(() => {
    switch (poll.value?.status) {
        case "archived": return "Archived";
        case "terminated": return "Canceled";
        case "completed": return "Done";
        default: return "Open";
    }
});
</script>

<template>
    <transition :css="false" @enter="onEnter" @leave="onLeave">
        <div v-if="poll" class="poll-widget" :style="[fontStyle, panelStyle]">
            <div class="poll-header">
                <span class="poll-title">{{ poll.title }}</span>
                <span class="poll-status" :class="poll.status">{{ statusLabel }}</span>
            </div>
            <div class="poll-choices">
                <div
                    v-for="choice in poll.choices"
                    :key="choice.id"
                    class="poll-choice"
                    :class="{ winner: isWinner(choice) }"
                >
                    <div class="poll-choice-row">
                        <span class="poll-choice-title">{{ choice.title }}</span>
                        <span class="poll-choice-meta">
                            <span v-if="settings.showPercentages !== false">{{ pct(choice.totalVotes) }}%</span>
                            <span class="poll-choice-votes">{{ choice.totalVotes }}</span>
                        </span>
                    </div>
                    <div class="poll-bar-track">
                        <div
                            class="poll-bar-fill"
                            :style="{ width: pct(choice.totalVotes) + '%', background: accentColor }"
                        ></div>
                    </div>
                </div>
            </div>
            <div v-if="showTimeBar" class="poll-time-track">
                <div
                    class="poll-time-fill"
                    :style="{ width: timeRemainingFraction * 100 + '%', background: timeBarColor }"
                ></div>
            </div>
        </div>
    </transition>
</template>

<style scoped>
.poll-widget {
    box-sizing: border-box;
    width: 100%;
    padding: 14px 16px 16px 16px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow: hidden;
}

.poll-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 2px;
}

.poll-title {
    font-size: 1.15em;
    font-weight: 700;
}

.poll-status {
    flex-shrink: 0;
    font-size: 0.65em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.14);
}

.poll-status.active {
    background: rgb(145 71 255);
}

.poll-status.completed {
    background: rgba(0, 199, 60, 0.50);
}

.poll-status.archived,
.poll-status.terminated {
    background: rgba(255, 107, 107, 0.50);
}

.poll-choices {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.poll-choice {
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.poll-choice-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 0.9em;
}

.poll-choice-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 8px;
}

.poll-choice-meta {
    display: flex;
    gap: 8px;
    opacity: 0.85;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
}

.poll-choice-votes {
    opacity: 0.7;
}

.poll-bar-track {
    width: 100%;
    height: 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.12);
    overflow: hidden;
}

.poll-bar-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.5s ease;
    min-width: 2px;
}

.poll-choice.winner .poll-choice-title {
    font-weight: 700;
}

.poll-choice.winner .poll-bar-fill {
    box-shadow: 0 0 8px currentColor;
    filter: brightness(1.15);
}

.poll-time-track {
    margin: 6px -16px -16px -16px;
    height: 5px;
    background: rgba(255, 255, 255, 0.12);
    overflow: hidden;
}

.poll-time-fill {
    height: 100%;
    transition: width 0.25s linear;
}
</style>
