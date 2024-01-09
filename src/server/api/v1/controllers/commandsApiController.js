"use strict";

const commandManager = require("../../../../backend/chat/commands/command-manager");
const commandRunner = require("../../../../backend/chat/commands/command-runner");

function getCommandTriggerAndArgs(req) {
    const body = req.body || {};
    const query = req.query || {};
    let args, username, metadata;

    // GET
    if (req.method === "GET") {
        args = query.args;
        username = query.username;

    // POST
    } else if (req.method === "POST") {
        args = body.args;
        username = body.username;
        metadata = body.metadata;
    }

    username = username ?? "API User";

    const trigger = {
        metadata: metadata || { }
    };

    trigger.metadata.username = trigger.metadata.username ?? username;

    return { trigger, args };
}

exports.getSystemCommands = async function(req, res) {
    const sysCommands = commandManager.getAllSystemCommandDefinitions();

    if (sysCommands == null) {
        return res.status(500).send({
            status: "error",
            message: "Unknown error getting system commands"
        });
    }

    const formattedSysCommands = sysCommands.map((command) => {
        return {
            id: command.id,
            trigger: command.trigger,
            name: command.name
        };
    });

    return res.json(formattedSysCommands);
};

exports.getSystemCommand = async function(req, res) {
    const sysCommandId = req.params.sysCommandId;

    if (!(sysCommandId?.length > 0)) {
        return res.status(400).send({
            status: "error",
            message: "No sysCommandId provided"
        });
    }

    const sysCommand = commandManager.getSystemCommandById(sysCommandId);

    if (sysCommand == null) {
        return res.status(404).send({
            status: "error",
            message: `System command '${sysCommandId}' not found`
        });
    }

    return res.json(sysCommand.definition);
};

exports.runSystemCommand = async function(req, res) {
    const sysCommandId = req.params.sysCommandId;

    if (!(sysCommandId?.length > 0)) {
        return res.status(400).send({
            status: "error",
            message: "No sysCommandId provided"
        });
    }

    const sysCommand = commandManager.getSystemCommandById(sysCommandId);

    if (sysCommand == null) {
        return res.status(404).send({
            status: "error",
            message: `System command '${sysCommandId}' not found`
        });
    }

    const { trigger, args } = getCommandTriggerAndArgs(req);

    try {
        commandRunner.runSystemCommandFromEffect(sysCommandId, trigger, args);
    } catch (e) {
        return res.status(500).send({
            status: "error",
            message: `Error executing system command '${sysCommandId}': ${e}`
        });
    }

    return res.status(200).send({
        status: "success",
        message: `System command '${sysCommandId}' executed successfully`
    });
};

exports.getCustomCommands = async function(req, res) {
    const customCommands = commandManager.getAllCustomCommands();

    if (customCommands == null) {
        return res.status(500).send({
            status: "error",
            message: "Unknown error getting custom commands"
        });
    }

    const formattedCustomCommands = customCommands.map((command) => {
        return {
            id: command.id,
            trigger: command.trigger,
            description: command.description
        };
    });

    return res.json(formattedCustomCommands);
};

exports.getCustomCommand = async function(req, res) {
    const customCommandId = req.params.customCommandId;

    if (!(customCommandId?.length > 0)) {
        return res.status(400).send({
            status: "error",
            message: "No customCommandId provided"
        });
    }

    const customCommand = commandManager.getCustomCommandById(customCommandId);

    if (customCommand == null) {
        return res.status(404).send({
            status: "error",
            message: `Custom command '${customCommandId}' not found`
        });
    }

    return res.json(customCommand);
};

exports.runCustomCommand = async function(req, res) {
    const customCommandId = req.params.customCommandId;

    if (!(customCommandId?.length > 0)) {
        return res.status(400).send({
            status: "error",
            message: "No customCommandId provided"
        });
    }

    const customCommand = commandManager.getCustomCommandById(customCommandId);

    if (customCommand == null) {
        return res.status(404).send({
            status: "error",
            message: `Custom command '${customCommandId}' not found`
        });
    }

    const { trigger, args } = getCommandTriggerAndArgs(req);

    try {
        commandRunner.runCustomCommandFromEffect(customCommandId, trigger, args);
    } catch (e) {
        return res.status(500).send({
            status: "error",
            message: `Error executing custom command '${customCommandId}': ${e}`
        });
    }

    return res.status(200).send({
        status: "success",
        message: `Custom command '${customCommandId}' executed successfully`
    });
};