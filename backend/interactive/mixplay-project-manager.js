"use strict";

const { ipcMain } = require("electron");
const logger = require("../logwrapper");
const profileManager = require("../common/profile-manager");
const fs = require("fs-extra");
const path = require("path");
const settings = require("../common/settings-access").settings;
const uuid = require("uuid/v1");
const frontendCommunicator = require("../common/frontend-communicator");
const devlabImporter = require("../import/devlab/devlab-importer");
const cloudSync = require("../cloud-sync/cloud-sync");
const effectManager = require("../effects/effectManager");

const MIXPLAY_FOLDER = profileManager.getPathInProfile("/mixplay/");

let projects = {};

function loadProjects() {
    fs.readdir(MIXPLAY_FOLDER, (err, files) => {
        if (err) {
            logger.warn("Error loading mixplay projects.", err);
            return;
        }
        let projectIds = files
            .filter(f =>
                f != null &&
                f.endsWith(".json") &&
                !isNaN(f.replace(".json", "")))
            .map(f => f.replace(".json", ""));

        for (let projectId of projectIds) {
            let projectDb = profileManager.getJsonDbInProfile("/mixplay/" + projectId);
            try {
                let project = projectDb.getData("/");
                projects[projectId] = project;
                logger.debug(`Loaded MixPlay project '${project.name}' (${projectId})`);
            } catch (err) {
                logger.warn(`There was an error reading a MixPlay project (${projectId}) from file.`);
            }
        }
    });
}

function saveProject(project) {
    projects[project.id] = project;
    let projectDb = profileManager.getJsonDbInProfile("/mixplay/" + project.id);
    try {
        projectDb.push("/", project);
        logger.debug(`Saved MixPlay project '${project.name}'.`);
    } catch (err) {
        logger.warn(`Unable to save MixPlay project '${project.name}'.`, err);
    }
}

function deleteProject(id) {
    delete projects[id];
    let filePath = path.join(MIXPLAY_FOLDER, id + ".json");
    fs.unlink(filePath, (err) => {
        if (!err) {
            logger.debug(`Successfully deleted MixPlay project id ${id}`);
        } else {
            logger.warn(`Unable to delete MixPlay project ${id}`, err);
        }
    });
}

function createNewProject(name) {

    let now = new Date();
    let id = now.getTime().toString();

    let mainSceneId = uuid();
    let mainScene = {
        id: mainSceneId,
        name: "Main",
        controls: []
    };

    let newProject = {
        id: id,
        name: name,
        createdAt: now,
        defaultSceneId: mainSceneId,
        scenes: [mainScene],
        cooldownGroups: []
    };

    saveProject(newProject);

    settings.setLastMixplayProjectId(id);

    return newProject;
}

function getProjects() {
    return Object.values(projects);
}

function getProjectById(id) {
    return projects[id];
}

ipcMain.on("getAllProjects", event => {
    logger.debug("got 'get all projects' request");
    event.returnValue = getProjects();
});

ipcMain.on("createNewProject", (event, projectName) => {
    logger.debug("got 'create project' request");
    event.returnValue = createNewProject(projectName);
});

frontendCommunicator.onAsync("createNewDevLabImportProject", async data => {
    logger.debug("got 'createNewDevLabImportProject' request");

    let { devLabId, projectName } = data;

    let newProject;
    try {
        newProject = await devlabImporter.importDevLabProject(devLabId, projectName);
    } catch (err) {
        renderWindow.webContents.send("error", "Failed to import DevLab project: " + err.message);
    }
    if (newProject != null) {
        saveProject(newProject);
        settings.setLastMixplayProjectId(newProject.id);
    }
    return newProject;
});

frontendCommunicator.onAsync("createNewShareCodeImportProject", async data => {
    logger.debug("got 'createNewShareCodeImportProject' request");

    let { shareCode, projectName } = data;

    let newProject;
    try {
        let projectData = await cloudSync.getData(shareCode);
        if (projectData != null && projectData.mixplayProject != null) {
            newProject = projectData.mixplayProject;
            newProject.name = projectName;

            let now = new Date();
            let newProjectId = now.getTime().toString();
            newProject.id = newProjectId;
        }
    } catch (err) {
        renderWindow.webContents.send("error", "Failed to import share code project: " + err.message);
    }
    if (newProject != null) {
        saveProject(newProject);
        settings.setLastMixplayProjectId(newProject.id);
    }
    return newProject;
});

frontendCommunicator.onAsync("getMixPlayProjectShareCode", async id => {
    let project = getProjectById(id);
    if (!project) return null;

    let projectCopy = JSON.parse(JSON.stringify(project));

    if (projectCopy.scenes) {
        projectCopy.scenes
            .forEach(s => s.controls
                .forEach(c => {
                    if (c.effects != null && c.effects.list != null) {
                        c.effects.list = effectManager.clearFilePaths(c.effects.list);
                    }
                    return c;
                }));
    }
    return await cloudSync.sync({ mixplayProject: projectCopy });
});

ipcMain.on("deleteProject", (_, id) => {
    logger.debug("got 'delete project' request");
    deleteProject(id);
});

ipcMain.on("saveProject", (_, project) => {
    logger.debug("got 'save project' request");
    saveProject(project);
});

exports.saveNewProject = (project) => {
    if (project != null) {
        saveProject(project);
        if (settings.getActiveMixplayProjectId() == null) {
            settings.setActiveMixplayProjectId(project.id);
        }
    }
};

exports.triggerUiRefresh = () => {
    frontendCommunicator.send("mixplay-projects-updated");
};

let connectedProjectId = null;
exports.getConnectedProjectId = () => connectedProjectId;
exports.setConnectedProjectId = (projectId) => {
    connectedProjectId = projectId;
};

exports.getConnectedProject = function() {
    const connectedProjectId = exports.getConnectedProjectId();

    return getProjectById(connectedProjectId);
};

exports.getControlByNameAndScene = (controlName, sceneName) => {
    if (sceneName == null || controlName == null) return null;

    const connectedProject = exports.getConnectedProject();

    if (connectedProject == null || connectedProject.scenes == null) return null;

    let scene = connectedProject.scenes.find(s => s.name.toLowerCase() === sceneName);

    if (scene == null) return null;

    let control = scene.controls.find(c => c.name.toLowerCase() === controlName.toLowerCase());

    return control;
};

exports.getControlInProject = function(projectId, controlId) {
    const project = getProjectById(projectId);
    if (project != null && project.scenes != null) {
        // maps all scenes to array with control arrays then flattens it to single array
        const controls = [].concat.apply([], project.scenes
            .filter(s => s.controls != null)
            .map(s => s.controls));

        return controls.find(c => c.id === controlId);
    }
    return null;
};

exports.hasProjects = () => projects != null && getProjects().length > 0;
exports.getProjectById = getProjectById;
exports.loadProjects = loadProjects;