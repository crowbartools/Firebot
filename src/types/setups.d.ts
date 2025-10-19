import { CommandDefinition } from "./commands";
import { Counter } from "./counters";
import { Currency } from "./currency";
import { EffectQueueConfig, PresetEffectList } from "./effects";
import { EventGroup, EventSettings } from "./events";
import { FirebotHotkey } from "./hotkeys";
import { OverlayWidgetConfig } from "./overlay-widgets";
import { QuickActionDefinition } from "./quick-actions";
import { RankLadder } from "./ranks";
import { CustomRole, LegacyCustomRole } from "./roles";
import { ScheduledTask, Timer } from "./timers";
import { VariableMacro } from "./variable-macros";

export type SetupImportQuestion = {
    replaceToken: string;
    answer: string;
};

export type FirebotSetup = {
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
    };
};