"use strict";

const variableManager = require("../../../../backend//variables/replace-variable-manager");

exports.getReplaceVariables = function(req, res) {
    const variables = variableManager.getReplaceVariables();

    if (Array.isArray(variables)) {
        variables.sort((a, b) => {
            const handleA = a.definition.handle.toLowerCase();
            const handleB = b.definition.handle.toLowerCase();
            if (handleA < handleB) {
                return -1;
            }
            if (handleA > handleB) {
                return 1;
            }
            return 0;
        });
    }

    res.json(variables);
};