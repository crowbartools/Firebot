"use strict";

const logger = require("../logwrapper");
const EventEmitter = require("events");

const expressionish = require("expressionish");
const ExpressionVariableError = expressionish.ExpressionVariableError;
const macroManager = require("./macro-manager");

const frontendCommunicator = require("../common/frontend-communicator");
const { getCustomVariable } = require("../common/custom-variable-manager");
const util = require("../utility");
class ReplaceVariableManager extends EventEmitter {
    #registeredVariableHandlers = new Map();
    #variableAndAliasHandlers = new Map();
    #registeredLookupHandlers = new Map();

    /**
     * @type {Record<string, Array<{ eventSourceId: string, eventId: string }>>}
     */
    additionalVariableEvents = {};

    constructor() {
        super();
    }

    #preeval(options, variable) {
        if (!variable.triggers) {
            return;
        }

        const optionsTrigger = options.trigger || { type: null };
        const display = options.trigger.type ? options.trigger.type.toLowerCase() : "unknown trigger";

        const varTrigger = variable.triggers[optionsTrigger.type];
        if (varTrigger == null || varTrigger === false) {
            throw new ExpressionVariableError(
                `$${variable.handle} does not support being triggered by: ${display}`,
                variable.position,
                variable.handle
            );
        }

        if (Array.isArray(varTrigger)) {
            if (optionsTrigger.type === "event") {
                const additionalEvents = this.additionalVariableEvents[variable.handle]?.map(e => `${e.eventSourceId}:${e.eventId}`) ?? [];
                varTrigger.push(...additionalEvents);
            }
            if (!varTrigger.some(id => id === options.trigger.id)) {
                throw new ExpressionVariableError(
                    `$${variable.handle} does not support this specific trigger type: ${display}`,
                    variable.position,
                    variable.handle
                );
            }
        }
    }

    registerReplaceVariable(variable) {
        if (this.#registeredVariableHandlers.has(variable.definition.handle)) {
            throw new TypeError(`A variable with the handle ${variable.definition.handle} already exists.`);
        }
        this.#registeredVariableHandlers.set(variable.definition.handle, {
            definition: variable.definition,
            handle: variable.definition.handle,
            argsCheck: variable.argsCheck,
            evaluator: variable.evaluator,
            triggers: variable.definition.triggers
        });

        this.#variableAndAliasHandlers = this._generateVariableAndAliasHandlers();

        logger.debug(`Registered replace variable ${variable.definition.handle}`);

        this.emit("replaceVariableRegistered", variable);

        frontendCommunicator.send("replace-variable-registered", variable.definition);
    }

    getReplaceVariables() {
        // Map register variables Map to array
        const registeredVariables = this.#registeredVariableHandlers;
        const variables = [];
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
        for (const [key, value] of registeredVariables) {
            variables.push(value);
        }
        return variables;
    }

    getVariableHandlers() {
        return this.#registeredVariableHandlers;
    }

    registerLookupHandler(prefix, lookup) {
        this.#registeredLookupHandlers.set(prefix, lookup);
    }

    _generateVariableAndAliasHandlers() {
        return Array.from(this.#registeredVariableHandlers.entries()).reduce((map, [mainHandle, varConfig]) => {
            map.set(mainHandle, varConfig);
            if (varConfig.definition.aliases) {
                varConfig.definition.aliases.forEach((alias) => {
                    map.set(alias, {
                        ...varConfig,
                        handle: alias
                    });
                });
            }
            return map;
        }, new Map());
    }

    evaluateText(input, metadata, trigger, onlyValidate) {
        if (input.includes("$")) {
            return expressionish({
                handlers: this.#variableAndAliasHandlers,
                expression: input,
                metadata,
                trigger,
                preeval: (options, variable) => this.#preeval(options, variable),
                lookups: this.#registeredLookupHandlers,
                onlyValidate: !!onlyValidate
            });
        }
        return input;
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
                        replacedValue = await this.evaluateText(value, trigger, { type: trigger.type, id: triggerId });
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
                if (value.includes("$") || value.includes("&")) {
                    try {
                        await this.evaluateText(
                            value,
                            undefined,
                            { type: trigger && trigger.type, id: trigger && trigger.id },
                            true
                        );
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

    addEventToVariable(variableHandle, eventSourceId, eventId) {
        const additionalEvents = this.additionalVariableEvents[variableHandle] ?? [];

        additionalEvents.push({ eventSourceId, eventId });

        this.additionalVariableEvents[variableHandle] = additionalEvents;

        frontendCommunicator.send("additional-variable-events-updated", this.additionalVariableEvents);
    }
}

const manager = new ReplaceVariableManager();

// custom variable shorthand
manager.registerLookupHandler("$", name => ({
    evaluator: (trigger, ...path) => {
        let result = getCustomVariable(name);
        for (const item of path) {
            if (result == null) {
                return null;
            }
            result = result[item];
        }
        return result == null ? null : result;
    }
}));

// Effect Output shorthand
manager.registerLookupHandler("&", name => ({
    evaluator: (trigger, ...path) => {
        let result = trigger.effectOutputs;
        if (result != null) {
            result = result[name];
            for (const item of path) {
                if (result == null) {
                    return null;
                }
                result = result[item];
            }
            return result == null ? null : result;
        }
        return null;
    }
}));

// Preset effect Args shorthand
manager.registerLookupHandler("#", name => ({
    evaluator: (trigger) => {
        const arg = (trigger.metadata?.presetListArgs || {})[name];
        return arg == null ? null : arg;
    }
}));

// Macro Args shorthand
manager.registerLookupHandler("^", name => ({
    evaluator: (trigger, ...args) => {
        const { macroArgs, macroNamedArgs } = trigger;
        if (
            (args == null || args.length === 0) &&
            macroArgs != null &&
            macroNamedArgs != null &&
            typeof name === "string"
        ) {
            const namedArgIdx = macroNamedArgs.findIndex(item => item === name);
            if (namedArgIdx > -1) {
                return macroArgs[namedArgIdx];
            }
        }
    }
}));

// Macro shorthand
manager.registerLookupHandler("%", name => ({
    evaluator: (trigger, ...macroArgs) => {
        const macro = macroManager.getMacroByName(name);
        if (macro != null) {
            return manager.evaluateText(
                macro.expression,
                { ...trigger, macro, macroArgs, macroNamedArgs: macro.argNames },
                trigger,
                false
            );
        }
    }
}));

frontendCommunicator.on("getReplaceVariableDefinitions", () => {
    logger.debug("got 'get all vars' request");
    return Array.from(manager.getVariableHandlers().values())
        .map(v => v.definition)
        .filter(v => !v.hidden);
});

frontendCommunicator.onAsync("validateVariables", async (eventData) => {
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

frontendCommunicator.on("get-additional-variable-events", () => {
    logger.debug("got 'get-additional-variable-events' request");
    return manager.additionalVariableEvents;
});

module.exports = manager;
