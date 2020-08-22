"use strict";

const logger = require("../../logwrapper");
const profileManager = require("../../common/profile-manager");
const frontendCommunicator = require("../../common/frontend-communicator");

/**
 * @typedef PresetEffectList
 * @property {string} id - the id of the preset effect list
 * @property {name} name - the name of the effect list
 * @property {object} effects - the saved effects in the list
 * @property {string} effects.id - the effect list root id
 * @property {any[]} effects.list - the array of effects objects
 */

/**
 * @type {Object.<string, PresetEffectList>}
 */
let presetEffectLists = {};

const EFFECTS_FOLDER = "/effects/";
function getPresetEffectListDb() {
    return profileManager
        .getJsonDbInProfile(EFFECTS_FOLDER + "preset-effect-lists");
}

function loadPresetEffectLists() {
    logger.debug(`Attempting to load preset effect lists...`);

    const presetEffectListDb = getPresetEffectListDb();

    try {
        const presetEffectListData = presetEffectListDb.getData("/");

        if (presetEffectListData) {
            presetEffectLists = presetEffectListData;
        }

        logger.debug(`Loaded preset effect lists.`);
    } catch (err) {
        logger.warn(`There was an error reading preset effect lists file.`, err);
    }
}

function savePresetEffectList(presetList) {
    if (presetList == null) return;

    presetEffectLists[presetList.id] = presetList;

    try {
        const presetEffectListDb = getPresetEffectListDb();

        presetEffectListDb.push("/" + presetList.id, presetList);

        logger.debug(`Saved preset effect list ${presetList.id} to file.`);
    } catch (err) {
        logger.warn(`There was an error saving a preset effect list.`, err);
    }
}

function deletePresetEffectList(presetListId) {
    if (presetListId == null) return;

    delete presetEffectLists[presetListId];

    try {
        const presetEffectListDb = getPresetEffectListDb();

        presetEffectListDb.delete("/" + presetListId);

        logger.debug(`Deleted preset effect list: ${presetListId}`);

    } catch (err) {
        logger.warn(`There was an error deleting a preset effect list.`, err);
    }
}

function getPresetEffectList(presetListId) {
    if (presetListId == null) return null;
    return presetEffectLists[presetListId];
}

frontendCommunicator.onAsync("getPresetEffectLists", async () => presetEffectLists);

frontendCommunicator.on("savePresetEffectList", (presetList) => {
    savePresetEffectList(presetList);
});

frontendCommunicator.on("deletePresetEffectList", (presetListId) => {
    deletePresetEffectList(presetListId);
});

exports.loadPresetEffectLists = loadPresetEffectLists;
exports.getPresetEffectList = getPresetEffectList;

