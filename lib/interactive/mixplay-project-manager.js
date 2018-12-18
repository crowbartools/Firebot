"use strict";

const { ipcMain } = require("electron");
const logger = require("../logwrapper");
const profileManager = require("../common/profile-manager");
const fs = require("fs");
const path = require("path");

const MIXPLAY_FOLDER = profileManager.getPathInProfile("/mixplay");

let projects = {};

function loadProjects() {
    fs.readdir(MIXPLAY_FOLDER, (err, files) => {
        let projectIds = files
            .filter(f => f != null && f.endsWith(".json") && !isNaN(f.replace(".json")))
            .map(f => f.replace(".json"));

        for (let projectId of projectIds) {
            let projectDb = profileManager.getJsonDbInProfile("/mixplay/" + projectId);
            try {
                let project = projectDb.getData("/");
                projects[projectId] = project;
                logger.debug(`Loaded MixPlay project '${project.name}' (${projectId})`);
            } catch (err) {
                logger.warning(`There was an error reading a MixPlay project (${projectId}) from file.`);
            }
        }
    });
}

function saveProject(project) {
    projects[project.id] = project;
    let projectDb = profileManager.getJsonDbInProfile("/mixplay/" + project.id);
    try {
        projectDb.push("/", project);
        logger.debug(`Saved MixPlay project '${name}'.`);
    } catch (err) {
        logger.warning(`Unable to save MixPlay project '${name}'.`, err);
    }
}

function deleteProject(id) {
    delete projects[id];
    let filePath = path.join(MIXPLAY_FOLDER, id + ".json");
    fs.unlink(filePath, (err) => {
        if (!err) {
            logger.debug(`Successfully deleted MixPlay project id ${id}`);
        } else {
            logger.warning(`Unable to delete MixPlay project ${id}`, err);
        }
    });
}

function createNewProject(name) {

    let now = new Date();
    let id = now.getTime().toString();

    let newProject = {
        id: id,
        name: name,
        createdAt: now,
        defaultSceneId: null,
        scenes: []
    };

    saveProject(newProject);

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


exports.loadProjects = loadProjects;