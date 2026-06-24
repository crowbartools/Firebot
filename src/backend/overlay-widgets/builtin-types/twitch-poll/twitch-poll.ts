import { OverlayWidgetType } from "../../../../types/overlay-widgets";
import { FontOptions } from "../../../../types/parameters";
import overlayWidgetConfigManager from "../../overlay-widget-config-manager";
import { ChannelPoll } from "../../../../types";
import { InternalBus } from "../../../internal-bus";
import { loadComponentExtension } from "../../builtin-widget-helpers";

export const TWITCH_POLL_TYPE_ID = "firebot:twitch-poll";

export type PollSettings = {
    fontOptions?: FontOptions;
    accentColor: string;
    backgroundColor: string;
    timeBarColor: string;
    showPercentages: boolean;
    /** How long (seconds) to keep the final results visible after the poll ends. */
    lingerSeconds: number;
};

export type PollState = {
    poll: ChannelPoll | null;
};

// Per-widget timers used to clear the results after a poll ends.
const lingerTimers = new Map<string, NodeJS.Timeout>();

function clearLingerTimer(widgetId: string) {
    const timer = lingerTimers.get(widgetId);
    if (timer) {
        clearTimeout(timer);
        lingerTimers.delete(widgetId);
    }
}


function updateAllPollWidgets(poll: ChannelPoll) {
    const configs = overlayWidgetConfigManager.getConfigsOfType(TWITCH_POLL_TYPE_ID);
    for (const config of configs) {
        if (config.active === false) {
            continue;
        }
        clearLingerTimer(config.id);
        overlayWidgetConfigManager.setWidgetStateById(config.id, { poll }, false);
    }
}

function handlePollEnd(poll: ChannelPoll) {
    const state: PollState = {
        poll: {
            ...poll,
            status: "completed"
        }
    };
    const configs = overlayWidgetConfigManager.getConfigsOfType(TWITCH_POLL_TYPE_ID);
    for (const config of configs) {
        if (config.active === false) {
            continue;
        }
        clearLingerTimer(config.id);
        overlayWidgetConfigManager.setWidgetStateById(config.id, state, false);

        const settings = (config.settings ?? {}) as Partial<PollSettings>;
        const lingerMs = Math.max(0, (settings.lingerSeconds ?? 8)) * 1000;
        const timer = setTimeout(() => {
            lingerTimers.delete(config.id);
            overlayWidgetConfigManager.setWidgetStateById(config.id, { poll: null } as PollState, false);
        }, lingerMs);
        lingerTimers.set(config.id, timer);
    }
}

function handlePollEvent(event: "begin" | "progress" | "end", poll: ChannelPoll) {
    // Only do work if there's at least one poll widget configured.
    if (overlayWidgetConfigManager.getConfigsOfType(TWITCH_POLL_TYPE_ID).length === 0) {
        return;
    }

    try {
        switch (event) {
            case "begin":
            case "progress":
                updateAllPollWidgets(poll);
                break;
            case "end":
                handlePollEnd(poll);
                break;
            default:
                break;
        }
    } catch {}
}

InternalBus.on("channel-poll-begin", (poll) => {
    handlePollEvent("begin", poll);
});

InternalBus.on("channel-poll-progress", (poll) => {
    handlePollEvent("progress", poll);
});

InternalBus.on("channel-poll-end", (poll) => {
    handlePollEvent("end", poll);
});

function generateSamplePollState(): PollState {
    return {
        poll: {
            title: "Which game next?",
            choices: [
                { id: "1", title: "Elden Ring", totalVotes: 142, channelPointsVotes: 0 },
                { id: "2", title: "Hollow Knight", totalVotes: 98, channelPointsVotes: 0 },
                { id: "3", title: "Celeste", totalVotes: 61, channelPointsVotes: 0 }
            ],
            winningChoiceIds: ["1"],
            isChannelPointsVotingEnabled: false,
            channelPointsPerVote: 0,
            startDate: new Date(),
            endDate: new Date(Date.now() + 5 * 60 * 1000),
            status: "active"
        }
    };
}

export const twitchPoll: OverlayWidgetType<PollSettings, PollState> = {
    id: TWITCH_POLL_TYPE_ID,
    name: "Twitch Poll",
    description: "Displays the currently running Twitch poll, with live vote totals. Shows nothing when no poll is active.",
    icon: "fa-poll-h",
    settingsSchema: [
        {
            name: "fontOptions",
            title: "Font",
            type: "font-options",
            default: {
                family: "Inter",
                weight: 600,
                size: 20,
                italic: false,
                color: "#FFFFFF"
            },
            allowAlpha: false
        },
        {
            name: "accentColor",
            title: "Accent Color",
            description: "Color of the vote bars and the winning choice highlight.",
            type: "hexcolor",
            default: "#9147FF"
        },
        {
            name: "backgroundColor",
            title: "Background Color",
            type: "hexcolor",
            default: "#18181B",
            allowAlpha: true
        },
        {
            name: "timeBarColor",
            title: "Time Remaining Bar Color",
            description: "Color of the countdown bar shown at the bottom while the poll is open.",
            type: "hexcolor",
            default: "#9147FF",
            showBottomHr: true
        },
        {
            name: "showPercentages",
            title: "Show Percentages",
            description: "Show each choice's share of the vote.",
            type: "boolean",
            default: true
        },
        {
            name: "lingerSeconds",
            title: "Results Linger (seconds)",
            description: "How long to keep the final results on screen after the poll ends.",
            type: "number",
            default: 8
        }
    ],
    initialAspectRatio: { width: 4, height: 3 },
    initialState: { poll: null },
    supportsLivePreview: true,
    livePreviewState: generateSamplePollState,
    componentExtension: loadComponentExtension("twitch-poll")
};
