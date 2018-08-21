"use strict";

const { ipcMain } = require("electron");
const logger = require("../../logwrapper");
const EventEmitter = require("events");
const Expression = require("./expression");

let exprEval = new Expression({
    transform: name => String(name).toLowerCase()
});

class VariableManager extends EventEmitter {
    constructor() {
        super();

        this._registeredReplaceVariables = [];

    }

    registerReplaceVariable(variable) {
        // TODO: validate variable

        this._registeredReplaceVariables.push(variable);

        logger.debug(`Registered variable ${variable.definition.id}`);

        this.emit("replaceVariableRegistered", variable);

        exprEval.use("test", variable.argCheck, variable.evaluator);
    }

    getSystemCommands() {
        return this._registeredReplaceVariables;
    }
}

const manager = new VariableManager();

/*ipcMain.on("getAllSystemCommands", event => {
    logger.info("got 'get all cmds' request");
    event.returnValue = manager.getSystemCommands();
});*/

module.exports = manager;
