"use strict";

const { DevLabImportError } = require("../../../shared/errors");

const api = require("../../api-access");

async function importDevLabProject(projectId) {
    let devlabProject = await api.get(`interactive/versions/${projectId}`, "v1", false, false);

}

exports.importDevLabProject = importDevLabProject;