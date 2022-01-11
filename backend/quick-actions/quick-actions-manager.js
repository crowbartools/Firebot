"use strict";

const frontendCommunicator = require("../common/frontend-communicator");
const JsonDbManager = require("../database/json-db-manager");

/**
 * @extends {JsonDbManager<QuickAction>}
 */
class CustomQuickActionManager extends JsonDbManager {
    constructor() {
        super("Custom Quick Action", "/custom-quick-actions");
    }

    /**
     * @emits
     * @returns {void}
     */
    triggerUiRefresh() {
        frontendCommunicator.send("all-custom-quick-actions", this.getAllItems());
    }
}

const customQuickActionManager = new CustomQuickActionManager();

frontendCommunicator.onAsync("getCustomQuickActions",
    async () => customQuickActionManager.getAllItems());

frontendCommunicator.onAsync("saveCustomQuickAction",
    async (/** @type {QuickAction} */ customQuickAction) => await customQuickActionManager.saveItem(customQuickAction));

frontendCommunicator.onAsync("saveAllCustomQuickActions",
    async (/** @type {QuickAction[]} */ allCustomQuickActions) => await customQuickActionManager.saveAllItems(allCustomQuickActions));

frontendCommunicator.on("deleteCustomQuickAction",
    (/** @type {string} */ customQuickActionId) => customQuickActionManager.deleteItem(customQuickActionId));

module.exports = customQuickActionManager;
