"use strict";

const { settings } = require('../common/settings-access');

const mixplayManager = require('./mixplay-project-manager');


function buildMixplayModalFromProject(project) {

}

function connectToMixPlay() {
    let currentProjectId = settings.getLastMixplayProjectId();

    let currentProject = mixplayManager.getProjectById(currentProjectId);

}