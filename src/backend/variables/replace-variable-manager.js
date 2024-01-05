"use strict";

const logger = require("../logwrapper");
const EventEmitter = require("events");

const expressionish = require('expressionish');
const frontendCommunicator = require("../common/frontend-communicator");
const util = require("../utility");

class ReplaceVariableManager extends EventEmitter {
    constructor() {
        super();
        this._registeredVariableHandlers = new Map();
    }

    registerReplaceVariable(variable) {
        if (this._registeredVariableHandlers.has(variable.definition.handle)) {
            throw new TypeError("A variable with this handle already exists.");
        }
        this._registeredVariableHandlers.set(
            variable.definition.handle,
            {
                definition: variable.definition,
                handle: variable.definition.handle,
                argsCheck: variable.argsCheck,
                evaluator: variable.evaluator,
                triggers: variable.definition.triggers
            }
        );

        logger.debug(`Registered replace variable ${variable.definition.handle}`);

        this.emit("replaceVariableRegistered", variable);

        frontendCommunicator.send("replace-variable-registered", variable.definition);
    }

    getReplaceVariables () {
        // Map register variables Map to array
        const registeredVariables = this._registeredVariableHandlers;
        const variables = [];
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
        for (const [key, value] of registeredVariables) {
            variables.push(value);
        }
        return variables;
    }
    getVariableHandlers() {
        return this._registeredVariableHandlers;
    }

    evaluateText(input, metadata, trigger) {
        return expressionish({
            handlers: this._registeredVariableHandlers,
            expression: input,
            metadata,
            trigger
        });
    }

    async findAndReplaceVariables(data, trigger) {
        const keys = Object.keys(data);

        for (const key of keys) {
            const value = data[key];

            if (value && typeof value === "string") {

                if (value.includes("$")) {
                    let replacedValue = value;
                    const triggerId = util.getTriggerIdFromTriggerData(trigger);
                    try {
                        replacedValue = await expressionish({
                            handlers: this._registeredVariableHandlers,
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

        const keys = Object.keys(data);
        for (const key of keys) {

            const value = data[key];

            if (value && typeof value === "string") {
                if (value.includes("$")) {
                    try {
                        await expressionish({
                            handlers: this._registeredVariableHandlers,
                            expression: value,
                            trigger: {
                                type: trigger && trigger.type,
                                id: trigger && trigger.id
                            },
                            onlyValidate: true
                        });

                    } catch (err) {
                        err.dataField = key;
                        err.rawText = value;
                        if (err instanceof expressionish.ExpressionArgumentsError) {
                            errors.push(err);
                            logger.debug(`Found variable error when validating`, err);

                        } else if (err instanceof expressionish.ExpressionError) {
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
}

const manager = new ReplaceVariableManager();

frontendCommunicator.on("getReplaceVariableDefinitions", () => {
    logger.debug("got 'get all vars' request");
    return Array.from(manager.getVariableHandlers().values()).map(v => v.definition);
});

frontendCommunicator.onAsync("validateVariables", async eventData => {
    logger.debug("got 'validateVariables' request");
    const { data, trigger } = eventData;

    let errors = [];
    try {
        errors = await manager.findAndValidateVariables(data, trigger);
    } catch (err) {
        logger.error("Unable to validate variables.", err);
    }

    return errors;
});

module.exports = manager;
