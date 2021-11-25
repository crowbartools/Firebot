"use strict";

const logger = require("../../logwrapper");
const profileManager = require("../../common/profile-manager");
const frontendCommunicator = require("../../common/frontend-communicator");

/**
 * @typedef SavedPresetEffectList
 * @property {string} id - the id of the preset effect list
 * @property {name} name - the name of the effect list
 * @property {object} effects - the saved effects in the list
 * @property {string} effects.id - the effect list root id
 * @property {any[]} effects.list - the array of effects objects
 */

/**
 * @type {Object.<string, SavedPresetEffectList>}
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

/**
 * @param {SavedPresetEffectList} presetEffectList
 */
async function savePresetEffectList(presetEffectList) {
    if (presetEffectList == null) {
        return;
    }

    if (presetEffectList.id != null) {
        presetEffectLists[presetEffectList.id] = presetEffectList;
    } else {
        const uuidv1 = require("uuid/v1");
        presetEffectList.id = uuidv1();
        presetEffectLists[presetEffectList.id] = presetEffectList;
    }

    try {
        const presetEffectListDb = getPresetEffectListDb();

        presetEffectListDb.push("/" + presetEffectList.id, presetEffectList);

        logger.debug(`Saved preset effect list ${presetEffectList.id} to file.`);

        return presetEffectList;
    } catch (err) {
        logger.warn(`There was an error saving a preset effect list.`, err);
        return null;
    }
}

/**
 *
 * @param {SavedPresetEffectList[]} allPresetEffectLists
 */
async function saveAllPresetEffectLists(allPresetEffectLists) {
    /** @type {Record<string,SavedPresetEffectList>} */
    const presetEffectListsObject = allPresetEffectLists.reduce((acc, current) => {
        acc[current.id] = current;
        return acc;
    }, {});

    presetEffectLists = presetEffectListsObject;

    try {
        const presetEffectListDb = getPresetEffectListDb();

        presetEffectListDb.push("/", presetEffectLists);

        logger.debug(`Saved all preset effect lists to file.`);

    } catch (err) {
        logger.warn(`There was an error saving all preset effect lists.`, err);
        return null;
    }
}

function deletePresetEffectList(presetEffectListId) {
    if (presetEffectListId == null) {
        return;
    }

    delete presetEffectLists[presetEffectListId];

    try {
        const presetEffectListDb = getPresetEffectListDb();

        presetEffectListDb.delete("/" + presetEffectListId);

        logger.debug(`Deleted preset effect list: ${presetEffectListId}`);

    } catch (err) {
        logger.warn(`There was an error deleting a preset effect list.`, err);
    }
}

function getPresetEffectList(presetEffectListId) {
    if (presetEffectListId == null) {
        return null;
    }
    return presetEffectLists[presetEffectListId];
}

function triggerUiRefresh() {
    frontendCommunicator.send("all-preset-lists", presetEffectLists);
}

frontendCommunicator.onAsync("getPresetEffectLists", async () => presetEffectLists);

frontendCommunicator.onAsync("savePresetEffectList",
    (/** @type {SavedPresetEffectList} */ presetEffectList) => savePresetEffectList(presetEffectList));

frontendCommunicator.onAsync("saveAllPresetEffectLists",
    async (/** @type {SavedPresetEffectList[]} */ allPresetEffectLists) => {
        saveAllPresetEffectLists(allPresetEffectLists);
    }
);

frontendCommunicator.on("deletePresetEffectList", (presetEffectListId) => {
    deletePresetEffectList(presetEffectListId);
});

exports.loadPresetEffectLists = loadPresetEffectLists;
exports.getPresetEffectList = getPresetEffectList;
exports.savePresetEffectList = savePresetEffectList;
exports.deletePresetEffectList = deletePresetEffectList;
exports.triggerUiRefresh = triggerUiRefresh;
