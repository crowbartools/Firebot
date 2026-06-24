import type { CommandDefinition } from "./commands";
import type { Counter } from "./counters";
import type { Currency } from "./currency";
import type { EffectQueueConfig, PresetEffectList } from "./effects";
import type { EventGroup, EventSettings } from "./events";
import type { FirebotHotkey } from "./hotkeys";
import type { OverlayWidgetConfig } from "./overlay-widgets";
import type { QuickActionDefinition } from "./quick-actions";
import type { RankLadder } from "./ranks";
import type { CustomRole, LegacyCustomRole } from "./roles";
import type { FirebotGlobalValue } from "./settings";
import type { ScheduledTask, Timer } from "./timers";
import type { VariableMacro } from "./variable-macros";

export type SetupImportQuestion = {
    replaceToken: string;
    answer: string;
};

type FirebotSetupGlobalValue = FirebotGlobalValue & {
    id: string;
};

export type FirebotSetup = {
    name: string;
    description: string;
    author: string;
    version: number;
    importQuestions: SetupImportQuestion[];
    requireCurrency: boolean;
    components: {
        commands: CommandDefinition[];
        counters: Counter[];
        currencies: Currency[];
        effectQueues: EffectQueueConfig[];
        events: EventSettings[];
        eventGroups: EventGroup[];
        hotkeys: FirebotHotkey[];
        presetEffectLists: PresetEffectList[];
        timers: Timer[];
        scheduledTasks: ScheduledTask[];
        variableMacros: VariableMacro[];
        viewerRoles: (LegacyCustomRole | CustomRole)[];
        viewerRankLadders: RankLadder[];
        quickActions: QuickActionDefinition[];
        overlayWidgetConfigs: OverlayWidgetConfig[];
        globalValues: FirebotSetupGlobalValue[];
    };
};