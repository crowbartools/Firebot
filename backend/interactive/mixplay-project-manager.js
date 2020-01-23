"use strict";

const { ipcMain } = require("electron");
const logger = require("../logwrapper");
const profileManager = require("../common/profile-manager");
const fs = require("fs");
const path = require("path");
const settings = require("../common/settings-access").settings;
const uuid = require("uuid/v1");
const frontendCommunicator = require("../common/frontend-communicator");
const devlabImporter = require("../import/devlab/devlab-importer");

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
        scenes: [mainScene]
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

ipcMain.on("deleteProject", (_, id) => {
    logger.debug("got 'delete project' request");
    deleteProject(id);
});

ipcMain.on("saveProject", (_, project) => {
    logger.debug("got 'save project' request");
    saveProject(project);
});

let connectedProjectId = null;
exports.getConnectedProjectId = () => connectedProjectId;
exports.setConnectedProjectId = (projectId) => {
    connectedProjectId = projectId;
};

exports.getConnectedProject = function() {
    const connectedProjectId = exports.getConnectedProjectId();

    return getProjectById(connectedProjectId);
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