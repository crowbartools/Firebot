"use strict";

const manager = require("../../../../backend//variables/replace-variable-manager");

exports.getReplaceVariables = function(req, res) {
    const sortedVariables = [...manager.getReplaceVariables()]
        .sort((a, b) => a.definition.handle.localeCompare(b.definition.handle));

    res.json(sortedVariables);
};