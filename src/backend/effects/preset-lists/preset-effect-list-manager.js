"use strict";

/** @import { PresetEffectList } from "../../../types/effects" */

const frontendCommunicator = require("../../common/frontend-communicator");
const JsonDbManager = require("../../database/json-db-manager");

/**
 * @hideconstructor
 * @extends {JsonDbManager<PresetEffectList>}
 * {@link JsonDbManager}
 */
class PresetEffectListManager extends JsonDbManager {
    constructor() {
        super("Preset Effect List", "/effects/preset-effect-lists");
    }

    /**
     * @returns {void}
     */
    triggerUiRefresh() {
        frontendCommunicator.send("all-preset-lists", this.getAllItems());
    }
}

const presetEffectListManager = new PresetEffectListManager();

frontendCommunicator.onAsync("getPresetEffectLists",
    async () => presetEffectListManager.getAllItems());

frontendCommunicator.onAsync("savePresetEffectList",
    async (/** @type {{ presetEffectList: PresetEffectList, isNew: boolean }} */ { presetEffectList, isNew }) => presetEffectListManager.saveItem(presetEffectList, isNew));

frontendCommunicator.onAsync("saveAllPresetEffectLists",
    async (/** @type {PresetEffectList[]} */ allPresetEffectLists) => presetEffectListManager.saveAllItems(allPresetEffectLists));

frontendCommunicator.on("deletePresetEffectList",
    (/** @type {string} */ presetEffectListId) => presetEffectListManager.deleteItem(presetEffectListId));

module.exports = presetEffectListManager;
