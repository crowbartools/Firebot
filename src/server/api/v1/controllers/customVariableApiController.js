"use strict";

const customVariableManager = require("../../../../backend/common/custom-variable-manager");

exports.getCustomVariables = function(req, res) {
    res.json(customVariableManager.getAllVariables());
};

exports.getCustomVariable = function(req, res) {
    const variableName = req.params.variableName;
    res.json(customVariableManager.getCustomVariable(variableName));
};

exports.setCustomVariable = function(req, res) {
    const name = req.params.variableName;
    const data = req.body && req.body.data;
    const ttl = req.body && req.body.ttl || 0;
    customVariableManager.addCustomVariable(name, data, ttl);
    res.status(201).send();
};