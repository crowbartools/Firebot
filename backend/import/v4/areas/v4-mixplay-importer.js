"use strict";
const fs = require("fs");
const path = require("path");
const uuid = require("uuid/v1");
const logger = require("../../../logwrapper");

const mixplayProjectManager = require("../../../interactive/mixplay-project-manager");

const importHelpers = require("../import-helpers");
const effectsMapper = require("../v4-effect-mapper");
const permissionMapper = require("../v4-permission-mapper");
const devlabImporter = require("../../devlab/devlab-importer");

/**
 * @returns {Promise<string[]>}
 */
function getMixPlayProjectFiles() {
    return new Promise(resolve => {
        let v4DataPath = importHelpers.v4DataPath;

        fs.readdir(path.join(v4DataPath, "/controls"), (err, files) => {

            if (err || files == null) {
                logger.warn("Failed to read files in v4 controls folder", err);
                return resolve([]);
            }

            // filter out nulls, non jsons, and json files that names arent a number
            let filteredFiles = files.filter(f =>
                f != null &&
                f.toLowerCase().includes(".json") &&
                !isNaN(f.toLowerCase().replace(".json", "")));

            resolve(filteredFiles || []);
        });
    });
}

function mapCooldownGroups(v4CooldownGroups) {
    if (v4CooldownGroups == null) return [];
    v4CooldownGroups = Object.values(v4CooldownGroups);
    let newCooldownGroups = [];
    for (let v4CooldownGroup of v4CooldownGroups) {
        let newGroup = {
            active: true,
            controlIds: [],
            duration: v4CooldownGroup.length || 0,
            id: uuid(),
            name: v4CooldownGroup.groupName || "Imported Cooldown Group"
        };
        newCooldownGroups.push(newGroup);
    }
    return newCooldownGroups;
}

function findV5ControlByName(project, sceneName, controlName) {
    if (project == null || project.scenes == null) return null;
    let scene = project.scenes.find(s => s.name === sceneName);
    if (scene == null || scene.controls == null) return null;
    return scene.controls.find(c => c.name === controlName);
}

exports.run = async () => {
    // attempt to import mixplay projects
    let incompatibilityWarnings = [];

    let mixPlayProjectFiles = await getMixPlayProjectFiles();
    let counter = 0;
    for (let mixPlayFile of mixPlayProjectFiles) {
        counter++;

        let projectDb = importHelpers.getJsonDbInV4Data(`/controls/${mixPlayFile}`);

        let data;
        try {
            data = projectDb.getData("/");
        } catch (err) {
            logger.warn("Error while attempting to load v4 mixplay project db.", err);
            continue;
        }

        if (data == null || data.mixer == null || data.mixer.length < 1) {
            logger.warn("Could not import v4 mixplay project as it appears to be formatted incorrectly.");
            continue;
        }

        let now = new Date();
        let newProjectId = now.getTime().toString();

        let newProject = {
            id: newProjectId,
            name: data.gameName != null && data.gameName !== "" ? data.gameName : `Imported V4 Project ${counter}`,
            createdAt: now,
            defaultSceneId: null,
            scenes: []
        };

        devlabImporter.mapDevLabScenesToFirebotProject(data.mixer, newProject);

        let firebotData = data.firebot;
        if (firebotData != null) {

            // import cooldown groups if they exist
            if (firebotData.cooldownGroups != null) {
                let cooldownGroups = mapCooldownGroups(firebotData.cooldownGroups);
                newProject.cooldownGroups = cooldownGroups;
            }

            if (firebotData.controls != null) {
                let v4Controls = Object.values(firebotData.controls);
                for (let v4Control of v4Controls) {
                    let v5Control = findV5ControlByName(newProject, v4Control.scene, v4Control.controlId);
                    if (v5Control == null) continue;

                    if (v4Control.effects != null) {
                        let effectsMapResult = effectsMapper.mapV4EffectList(v4Control.effects, { type: "MixPlay Control", name: v4Control.controlId });
                        if (effectsMapResult) {
                            v5Control.effects = effectsMapResult.effects;
                            incompatibilityWarnings = incompatibilityWarnings.concat(effectsMapResult.incompatibilityWarnings);
                        }
                    }

                    if (v4Control.kind != null) {
                        if (v4Control.kind === "button") {
                            if (v4Control.text != null) {
                                v5Control.mixplay.text = v4Control.text;
                            }
                            if (v4Control.cost != null && !isNaN(v4Control.cost)) {
                                v5Control.mixplay.cost = parseInt(v4Control.cost);
                            }
                            if (v4Control.tooltip != null) {
                                v5Control.mixplay.tooltip = v4Control.tooltip;
                            }
                            if (v4Control.cooldown != null && !isNaN(v4Control.cooldown)) {
                                v5Control.mixplay.cooldown = parseInt(v4Control.cooldown);
                            }
                        }
                        if (v4Control.kind === "textbox") {
                            if (v4Control.text != null) {
                                v5Control.mixplay.text = v4Control.text;
                            }
                            if (v4Control.cost != null && !isNaN(v4Control.cost)) {
                                v5Control.mixplay.cost = parseInt(v4Control.cost);
                            }
                        }
                    }

                    //check if control is in a known cooldowngroup
                    if (v4Control.cooldownGroup != null && newProject.cooldownGroups != null) {
                        let v5CooldownGroup = newProject.cooldownGroups.find(cg => cg.name === v4Control.cooldownGroup);
                        if (v5CooldownGroup) {
                            v5CooldownGroup.controlIds.push(v5Control.id);
                        }
                    }

                    let restrictionData = permissionMapper.mapV4Permissions(v5Control.permissionType, v5Control.permissions);
                    v5Control.restrictionData = restrictionData;

                    v5Control.active = v4Control.active !== false;
                }
            }
        }

        mixplayProjectManager.saveNewProject(newProject);
    }

    mixplayProjectManager.triggerUiRefresh();

    return {
        success: true,
        incompatibilityWarnings: incompatibilityWarnings
    };
};