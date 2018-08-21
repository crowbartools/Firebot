"use strict";

const { ipcMain } = require("electron");
const logger = require("../../logwrapper");
const EventEmitter = require("events");
const Expression = require("./expression");


class ReplaceVariableManager extends EventEmitter {
    constructor() {
        super();
        this._registeredReplaceVariables = [];
    }

    registerReplaceVariable(variable) {
        // TODO: validate variable obj

        if (this._registeredReplaceVariables.some(v => v.definition.id === variable.definition.id)) {
            throw new TypeError("A variable with this id already exists.");
        }

        this._registeredReplaceVariables.push(variable);

        //register handlers with expression system
        Expression.use(variable.definition.handle, variable.argCheck, variable.evaluator);

        logger.debug(`Registered replace variable ${variable.definition.id}`);

        this.emit("replaceVariableRegistered", variable);
    }

    getReplaceVariables () {
        return this._registeredReplaceVariables;
    }

    evaluateText(input, metadata) {
        return Expression.evaluate(input, metadata);
    }
}

const manager = new ReplaceVariableManager();

ipcMain.on("getReplaceVariableDefinitions", event => {
    logger.info("got 'get all vars' request");
    event.returnValue = manager.getReplaceVariables().map(v => v.definition);
});

module.exports = manager;
