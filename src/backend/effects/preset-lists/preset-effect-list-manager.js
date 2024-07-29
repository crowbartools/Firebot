"use strict";

const frontendCommunicator = require("../../common/frontend-communicator");
const JsonDbManager = require("../../database/json-db-manager");

/**
 * @typedef PresetEffectList
 * @prop {string} id - the id of the effect list
 * @prop {string} name - the name of the effect list
 * @prop {object[]} args - the arguments of the effect list
 * @prop {object} effects - the saved effects in the list
 * @prop {string} effects.id - the effect list root id
 * @prop {any[]} effects.list - the array of effects objects
 * @prop {string[]} sortTags - the tags for the effect list
 */

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
    async (/** @type {PresetEffectList} */ presetEffectList) => presetEffectListManager.saveItem(presetEffectList));

frontendCommunicator.onAsync("saveAllPresetEffectLists",
    async (/** @type {PresetEffectList[]} */ allPresetEffectLists) => presetEffectListManager.saveAllItems(allPresetEffectLists));

frontendCommunicator.on("deletePresetEffectList",
    (/** @type {string} */ presetEffectListId) => presetEffectListManager.deleteItem(presetEffectListId));

module.exports = presetEffectListManager;
