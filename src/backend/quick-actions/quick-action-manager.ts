import { QuickActionDefinition, SystemQuickAction } from "../../types/quick-actions";
import { EffectList } from "../../types/effects";
import { Trigger } from "../../types/triggers";

import JsonDbManager from "../database/json-db-manager";
import { AccountAccess } from "../common/account-access";
import { PresetEffectListManager } from "../effects/preset-lists/preset-effect-list-manager";
import { SettingsManager } from "../common/settings-manager";
import effectRunner from "../common/effect-runner";
import frontendCommunicator from "../common/frontend-communicator";

import { GiveCurrencyQuickAction } from "./builtin/give-currency";
import { OpenRewardQueueQuickAction } from "./builtin/open-reward-request-queue";
import { StreamInfoQuickAction } from "./builtin/stream-info";
import { StreamPreviewQuickAction } from "./builtin/stream-preview";
import { StreamScheduleQuickAction } from "./builtin/stream-schedule";


class QuickActionManager extends JsonDbManager<QuickActionDefinition> {
    systemQuickActions: SystemQuickAction[] = [
        GiveCurrencyQuickAction,
        OpenRewardQueueQuickAction,
        StreamInfoQuickAction,
        StreamPreviewQuickAction,
        StreamScheduleQuickAction
    ];

    constructor() {
        super("Custom Quick Action", "/custom-quick-actions");

        frontendCommunicator.on("quick-actions:get-quick-actions",
            () => this.getAllItems()
        );

        frontendCommunicator.on("quick-actions:save-custom-quick-action",
            (customQuickAction: QuickActionDefinition) =>
                this.saveQuickAction(customQuickAction)
        );

        frontendCommunicator.on("quick-actions:save-all-custom-quick-actions",
            (allCustomQuickActions: QuickActionDefinition[]) =>
                this.saveAllItems(allCustomQuickActions)
        );

        frontendCommunicator.on("quick-actions:delete-custom-quick-action",
            (customQuickActionId: string) =>
                this.deleteQuickAction(customQuickActionId)
        );

        frontendCommunicator.on("quick-actions:trigger-quick-action",
            (quickActionId: string) => this.triggerQuickAction(quickActionId)
        );
    }

    loadItems(): void {
        super.loadItems();
        this.rebuildSettings();
    }

    getAllItems(): QuickActionDefinition[] {
        return [
            ...this.getSystemQuickActionDefinitions(),
            ...Object.values(this.items)
        ];
    }

    rebuildSettings(): void {
        const settings = SettingsManager.getSetting("QuickActions");
        const allItems = this.getAllItems();

        // Remove stale items
        const settingsKeys = Object.keys(settings);
        for (const action of settingsKeys) {
            if (!allItems.some(i => i.id === action)) {
                delete settings[action];
            }
        }

        // Renumber
        const totalSettings = Object.keys(settings).length;
        const sortedSettings = Object.keys(settings)
            .map(key => ({
                id: key,
                position: settings[key].position
            }))
            .sort((a, b) => a.position - b.position);
        for (let i = 0; i < totalSettings; i++) {
            settings[sortedSettings[i].id].position = i;
        }

        // Add missing items
        for (const item of allItems) {
            if (!settings[item.id]) {
                settings[item.id] = {
                    enabled: true,
                    position: Object.keys(settings).length
                };
            }
        }

        SettingsManager.saveSetting("QuickActions", settings);
    }

    saveQuickAction(quickAction: QuickActionDefinition, notify = true): QuickActionDefinition {
        const savedQuickAction = super.saveItem(quickAction);
        if (!savedQuickAction) {
            return;
        }

        this.rebuildSettings();

        if (notify) {
            this.triggerUiRefresh();
        }

        return savedQuickAction;
    }

    deleteQuickAction(customQuickActionId: string): void {
        if (super.deleteItem(customQuickActionId)) {
            this.rebuildSettings();
            this.triggerUiRefresh();
        }
    }

    getSystemQuickActionDefinitions(): QuickActionDefinition[] {
        return this.systemQuickActions.map(sqa => sqa.definition);
    }

    triggerQuickAction(quickActionId: string): void {
        const triggeredQuickAction = [
            ...this.getSystemQuickActionDefinitions(),
            ...Object.values(this.items)
        ].find(qa => qa.id === quickActionId);

        if (triggeredQuickAction.type === 'custom') {
            let effects: EffectList = null;
            let presetArgValues: Record<string, unknown> = null;

            if (triggeredQuickAction.presetListId != null) {
                const presetList = PresetEffectListManager.getItem(triggeredQuickAction.presetListId);
                if (triggeredQuickAction.promptForArgs && presetList?.args?.length > 0) {
                    frontendCommunicator.send("show-run-preset-list-modal", triggeredQuickAction.presetListId);
                    return;
                }
                effects = presetList?.effects;
                presetArgValues = triggeredQuickAction.presetArgValues;
            } else if (triggeredQuickAction.effectList != null) {
                effects = triggeredQuickAction.effectList;
            }

            const request = {
                trigger: {
                    type: "quick_action",
                    metadata: {
                        username: AccountAccess.getAccounts().streamer.username,
                        presetListArgs: presetArgValues
                    }
                } as Trigger,
                effects: effects
            };

            void effectRunner.processEffects(request);
            return;
        }

        const systemQuickAction = this.systemQuickActions.find(sqa => sqa.definition.id === quickActionId);
        systemQuickAction.onTriggerEvent();
    }

    triggerUiRefresh(): void {
        frontendCommunicator.send("quick-actions:all-quick-actions-updated", this.getAllItems());
    }
}

const quickActionManager = new QuickActionManager();

export { quickActionManager as QuickActionManager };