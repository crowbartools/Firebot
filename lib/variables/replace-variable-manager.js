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

ipcMain.on("getReplaceVariableDefinitions", (event, trigger) => {
    logger.info("got 'get all vars' request");
    if (trigger != null) {

        let variables = manager.getReplaceVariables()
            .map(v => v.definition)
            .filter(v => {

                if (v.triggers == null) {
                    return true;
                }

                let variableTrigger = v.triggers[trigger.type];
                if (variableTrigger === true) {
                    return true;
                }

                if (Array.isArray(variableTrigger)) {
                    if (variableTrigger.some(id => id === trigger.id)) {
                        return true;
                    }
                }

                return false;
            });
        event.returnValue = variables;
        return;
    }
    event.returnValue = manager.getReplaceVariables().map(v => v.definition);
});

module.exports = manager;
