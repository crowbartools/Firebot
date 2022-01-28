"use strict";

const frontendCommunicator = require("../common/frontend-communicator");
const JsonDbManager = require("../database/json-db-manager");
const effectRunner = require("../common/effect-runner");
const presetEffectListManager = require("../effects/preset-lists/preset-effect-list-manager");
const { EffectTrigger } = require("../../shared/effect-constants");
const accountAccess = require("../common/account-access");

/** @typedef {import("../../shared/types").QuickActionDefinition} QuickActionDefinition */

/**
 * @extends {JsonDbManager<QuickActionDefinition>}
 */
class CustomQuickActionManager extends JsonDbManager {
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
            "stream-preview"
        ].forEach(filename => {
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
            const presetList = presetEffectListManager.getItem(triggeredQuickAction.presetListId);

            const request = {
                trigger: {
                    type: EffectTrigger.QUICK_ACTION,
                    metadata: {
                        username: accountAccess.getAccounts().streamer.username
                    }
                },
                effects: presetList.effects
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

const customQuickActionManager = new CustomQuickActionManager();

frontendCommunicator.onAsync("getQuickActions",
    async () => customQuickActionManager.getAllItems());

frontendCommunicator.onAsync("saveCustomQuickAction",
    async (/** @type {QuickActionDefinition} */ customQuickAction) => await customQuickActionManager.saveItem(customQuickAction));

frontendCommunicator.onAsync("saveAllCustomQuickActions",
    async (/** @type {QuickActionDefinition[]} */ allCustomQuickActions) => await customQuickActionManager.saveAllItems(allCustomQuickActions));

frontendCommunicator.on("deleteCustomQuickAction",
    (/** @type {string} */ customQuickActionId) => customQuickActionManager.deleteItem(customQuickActionId));

frontendCommunicator.on("triggerQuickAction", quickActionId => {
    customQuickActionManager.triggerQuickAction(quickActionId);
});

module.exports = customQuickActionManager;
