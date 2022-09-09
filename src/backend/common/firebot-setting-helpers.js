"use strict";

/**
 * This take the setting category definitions and sets the value for the settings based on previous save data
 * @param {*} settingCategories
 * @param {*} currentSavedSettings
 */
function setValuesForFrontEnd(settingCategories, currentSavedSettings) {
    if (currentSavedSettings == null) {
        currentSavedSettings = {};
    }
    if (settingCategories) {
        for (const categoryId of Object.keys(settingCategories)) {
            for (const settingId of Object.keys(settingCategories[categoryId].settings)) {
                if (currentSavedSettings[categoryId] != null) {
                    settingCategories[categoryId].settings[settingId].value = currentSavedSettings[categoryId][settingId];
                } else {
                    settingCategories[categoryId].settings[settingId].value = settingCategories[categoryId].settings[settingId].default;
                }
            }
        }
    }
    return settingCategories;
}


/**
 * Builds save data based on the setting categories returned from the front end
 * @param {*} settingCategories
 * @param {*} currentSavedSettings
 */
function buildSaveDataFromSettingValues(settingCategories, currentSavedSettings) {
    if (currentSavedSettings == null) {
        currentSavedSettings = {};
    }
    if (settingCategories) {
        for (const categoryId of Object.keys(settingCategories)) {
            if (currentSavedSettings[categoryId] == null) {
                currentSavedSettings[categoryId] = {};
            }
            for (const settingId of Object.keys(settingCategories[categoryId].settings)) {
                currentSavedSettings[categoryId][settingId] = settingCategories[categoryId].settings[settingId].value;
            }
        }
    }
    return currentSavedSettings;
}

exports.setValuesForFrontEnd = setValuesForFrontEnd;
exports.buildSaveDataFromSettingValues = buildSaveDataFromSettingValues;