"use strict";

const { ipcMain } = require("electron");
const logger = require("../logwrapper");
const EventEmitter = require("events");
const Expression = require("./expression");


class ReplaceVariableManager extends EventEmitter {
    constructor() {
        super();
        this._registeredReplaceVariables = [];
    }

    registerReplaceVariable(variable) {
        // TODO: validate variable obj

        if (this._registeredReplaceVariables.some(v => v.definition.handle === variable.definition.handle)) {
            throw new TypeError("A variable with this handle already exists.");
        }

        this._registeredReplaceVariables.push(variable);

        //register handlers with expression system
        Expression.use(
            {
                handle: variable.definition.handle,
                argsCheck: variable.argsCheck,
                evaluate: variable.evaluator,
                triggers: variable.definition.triggers
            }
        );

        logger.debug(`Registered replace variable ${variable.definition.handle}`);

        this.emit("replaceVariableRegistered", variable);
    }

    getReplaceVariables () {
        return this._registeredReplaceVariables;
    }

    evaluateText(input, metadata, trigger) {
        return Expression.evaluate({
            expression: input,
            metadata: metadata,
            trigger: trigger
        });
    }
}

const manager = new ReplaceVariableManager();

ipcMain.on("getReplaceVariableDefinitions", event => {
    logger.info("got 'get all vars' request");
    event.returnValue = manager.getReplaceVariables().map(v => v.definition);
});

module.exports = manager;
