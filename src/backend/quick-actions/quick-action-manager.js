"use strict";

const frontendCommunicator = require("../common/frontend-communicator");
const JsonDbManager = require("../database/json-db-manager");
const effectRunner = require("../common/effect-runner");
const presetEffectListManager = require("../effects/preset-lists/preset-effect-list-manager");
const { EffectTrigger } = require("../../shared/effect-constants");
const accountAccess = require("../common/account-access");
const { SettingsManager } = require("../common/settings-manager");

/** @typedef {import("../../shared/types").QuickActionDefinition} QuickActionDefinition */

/**
 * @extends {JsonDbManager<QuickActionDefinition>}
 */
class QuickActionManager extends JsonDbManager {
    constructor() {
        super("Custom Quick Action", "/custom-quick-actions");

        this.systemQuickActions = [];
    }

    /**
     * @override
     * @inheritdoc
     */
    loadItems() {
        super.loadItems();

        [
            "give-currency",
            "stream-info",
            "stream-preview",
            "open-reward-request-queue"
        ].forEach((filename) => {
            const quickAction = require(`./builtin/${filename}.js`);
            this.systemQuickActions.push(quickAction);
        });
    }

    /**
     * @override
     * @inheritdoc
     * @returns {QuickActionDefinition[]}
     */
    getAllItems() {
        return [
            ...this.getSystemQuickActionDefinitions(),
            ...Object.values(this.items)
        ];
    }

    saveQuickAction(quickAction, notify = true) {
        const savedQuickAction = super.saveItem(quickAction);
        if (!savedQuickAction) {
            return;
        }
        const quickActionSettings = SettingsManager.getSetting("QuickActions");
        if (!Object.keys(quickActionSettings).includes(quickAction.id)) {
            quickActionSettings[quickAction.id] = { enabled: true, position: Object.keys(quickActionSettings).length };
            SettingsManager.saveSetting("QuickActions", quickActionSettings);
        }
        if (notify) {
            this.triggerUiRefresh();
        }
        return savedQuickAction;
    }

    deleteQuickAction(customQuickActionId) {
        if (super.deleteItem(customQuickActionId)) {
            const quickActionSettings = SettingsManager.getSetting("QuickActions");
            delete quickActionSettings[customQuickActionId];
            SettingsManager.saveSetting("QuickActions", quickActionSettings);
        }
    }

    /**
     * @returns {QuickActionDefinition[]}
     */
    getSystemQuickActionDefinitions() {
        return this.systemQuickActions.map(sqa => sqa.definition);
    }

    triggerQuickAction(quickActionId) {
        const triggeredQuickAction = [
            ...this.getSystemQuickActionDefinitions(),
            ...Object.values(this.items)
        ].find(qa => qa.id === quickActionId);

        if (triggeredQuickAction.type === 'custom') {
            let effects = [];
            let presetArgValues = undefined;

            if (triggeredQuickAction.presetListId != null) {
                const presetList = presetEffectListManager.getItem(triggeredQuickAction.presetListId);
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
                    type: EffectTrigger.QUICK_ACTION,
                    metadata: {
                        username: accountAccess.getAccounts().streamer.username,
                        presetListArgs: presetArgValues
                    }
                },
                effects: effects
            };

            effectRunner.processEffects(request);
            return;
        }

        const systemQuickAction = this.systemQuickActions.find(sqa => sqa.definition.id === quickActionId);
        systemQuickAction.onTriggerEvent();
    }

    /**
     * @returns {void}
     */
    triggerUiRefresh() {
        frontendCommunicator.send("all-quick-actions", this.getAllItems());
    }
}

const quickActionManager = new QuickActionManager();

frontendCommunicator.onAsync("getQuickActions",
    async () => quickActionManager.getAllItems());

frontendCommunicator.onAsync("saveCustomQuickAction",
    async (/** @type {QuickActionDefinition} */ customQuickAction) => await quickActionManager.saveQuickAction(customQuickAction));

frontendCommunicator.onAsync("saveAllCustomQuickActions",
    async (/** @type {QuickActionDefinition[]} */ allCustomQuickActions) => await quickActionManager.saveAllItems(allCustomQuickActions));

frontendCommunicator.on("deleteCustomQuickAction",
    (/** @type {string} */ customQuickActionId) => quickActionManager.deleteQuickAction(customQuickActionId));

frontendCommunicator.on("triggerQuickAction", (quickActionId) => {
    quickActionManager.triggerQuickAction(quickActionId);
});

module.exports = quickActionManager;
