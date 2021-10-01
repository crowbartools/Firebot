"use strict";

const logger = require("../logwrapper");
const EventEmitter = require("events");
const Expression = require("./expression");
const { ExpressionArgumentsError, ExpressionError } = require("./expression-errors");

const frontendCommunicator = require("../common/frontend-communicator");


class ReplaceVariableManager extends EventEmitter {
    constructor() {
        super();
        this._registeredReplaceVariables = [];
    }

    registerReplaceVariable(variable) {
        if (this._registeredReplaceVariables.some(v => v.definition.handle === variable.definition.handle)) {
            throw new TypeError("A variable with this handle already exists.");
        }

        this._registeredReplaceVariables.push(variable);

        //register handlers with expression system
        Expression.use(
            {
                handle: variable.definition.handle,
                argsCheck: variable.argsCheck,
                evaluator: variable.evaluator,
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

    async findAndReplaceVariables(data, trigger) {
        let keys = Object.keys(data);

        for (let key of keys) {

            let value = data[key];

            if (value && typeof value === "string") {
                if (value.includes("$")) {
                    let replacedValue = value;
                    let triggerId = this.getTriggerIdFromTriggerData(trigger);
                    try {
                        replacedValue = await Expression.evaluate({
                            expression: value,
                            metadata: trigger,
                            trigger: {
                                type: trigger.type,
                                id: triggerId
                            }
                        });
                    } catch (err) {
                        logger.warn(`Unable to parse variables for value: '${value}'`, err);
                    }
                    data[key] = replacedValue;
                }
            } else if (value && typeof value === "object") {
                // recurse
                await this.findAndReplaceVariables(value, trigger);
            }
        }
    }

    async findAndValidateVariables(data, trigger, errors) {

        if (errors == null) {
            errors = [];
        }

        let keys = Object.keys(data);
        for (let key of keys) {

            let value = data[key];

            if (value && typeof value === "string") {
                if (value.includes("$")) {
                    try {
                        await Expression.validate({
                            expression: value,
                            trigger: {
                                type: trigger && trigger.type,
                                id: trigger && trigger.id
                            }
                        });
                    } catch (err) {
                        err.dataField = key;
                        err.rawText = value;
                        if (err instanceof ExpressionArgumentsError) {
                            errors.push(err);
                            logger.debug(`Found variable error when validating`, err);
                        } else if (err instanceof ExpressionError) {
                            errors.push({
                                dataField: err.dataField,
                                message: err.message,
                                position: err.position,
                                varname: err.varname,
                                character: err.character,
                                rawText: err.rawText
                            });
                            logger.debug(`Found variable error when validating`, err);
                        } else {
                            logger.error(`Unknown error when validating variables for string: '${value}'`, err);
                        }
                    }
                }
            } else if (value && typeof value === "object") {
                // recurse
                await this.findAndValidateVariables(value, trigger, errors);
            }
        }

        return errors;
    }

    getTriggerIdFromTriggerData(trigger) {
        let { eventSource, event } = trigger.metadata;

        if (eventSource && event) {
            return `${eventSource.id}:${event.id}`;
        }

        return undefined;
    }
}

const manager = new ReplaceVariableManager();

frontendCommunicator.on("getReplaceVariableDefinitions", trigger => {
    logger.debug("got 'get all vars' request");
    if (trigger != null) {

        let variables = manager.getReplaceVariables()
            .map(v => v.definition)
            .filter(v => {

                if (trigger.dataOutput === "number") {
                    if (v.possibleDataOutput == null || !v.possibleDataOutput.includes("number")) {
                        return false;
                    }
                }

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
        return variables;
    }
    return manager.getReplaceVariables().map(v => v.definition);
});

frontendCommunicator.onAsync("validateVariables", async eventData => {
    logger.debug("got 'validateVariables' request");
    let { data, trigger } = eventData;

    let errors = [];
    try {
        errors = await manager.findAndValidateVariables(data, trigger);
    } catch (err) {
        logger.error("Unable to validate variables.", err);
    }

    return errors;
});

module.exports = manager;
