import EventEmitter from "events";
import expressionish, * as expressionishErrs from "expressionish";
import type {
    ReplaceVariable,
    RegisteredVariable,
    VariableUsage,
    TriggerMeta,
    TriggerType,
    Trigger
} from "../../types/variables";
import type { Awaitable } from "../../types/util-types";
import { SettingsManager } from "../common/settings-manager";
import macroManager from "./macro-manager";
import { CustomVariableManager } from "../common/custom-variable-manager";
import frontendCommunicator from "../common/frontend-communicator";
import logger from "../logwrapper";
import { getEventIdFromTriggerData } from "../utils";

type Evaluator = {
    evaluator(trigger: Trigger, ...args: unknown[]): Awaitable<unknown>;
};

type TriggerWithId = Omit<Trigger, "metadata"> & {
    id?: string;
    metadata?: Record<string, unknown>;
};

type MacroTrigger = Trigger & {
    macroArgs: string[];
    macroArgNames: string[];
};

type EvaluatedRegisteredVariable = RegisteredVariable & {
    position: number;
};

type VariableError = {
    message: string;
    dataField: string;
    rawText: string;
    position: number;
    varname: string;
    character: string;
};

class ReplaceVariableManager extends EventEmitter {
    private registeredVariableHandlers: Map<string, RegisteredVariable> = new Map();
    private variableAndAliasHandlers: Map<string, RegisteredVariable> = new Map();
    private registeredLookupHandlers: Map<
        string,
        (name: string) => Evaluator
    > = new Map();

    additionalVariableEvents: Record<string, Array<{
        eventSourceId: string;
        eventId: string;
    }>> = {};

    constructor() {
        super();

        frontendCommunicator.on("variables:get-replace-variable-definitions", () => {
            logger.debug("got 'get all vars' request");
            return Array.from(this.getVariableHandlers().values())
                .map(v => v.definition)
                .filter(v => !v.hidden);
        });

        frontendCommunicator.onAsync("variables:validate-variables", async (
            eventData: {
                data: Record<string, unknown>;
                trigger: Trigger;
            }) => {
            logger.debug("got 'variables:validate-variables' request");
            const { data, trigger } = eventData;

            let errors: VariableError[] = [];
            try {
                errors = await this.findAndValidateVariables(data, trigger);
            } catch (err) {
                logger.error("Unable to validate variables.", err);
            }

            return errors;
        });

        frontendCommunicator.onAsync("variables:get-variable-suggestions", async (
            eventData: {
                variableHandle: string;
                triggerType: TriggerType;
                triggerMeta: Record<string, unknown>;
            }) => {
            logger.debug("got 'get-variable-suggestions' request");
            const { variableHandle, triggerType, triggerMeta } = eventData;
            const suggestions = await this.getSuggestionsForVariable(variableHandle, triggerType, triggerMeta);
            return suggestions;
        });

        frontendCommunicator.on("variables:get-additional-variable-events", () => {
            logger.debug("got 'get-additional-variable-events' request");
            return this.additionalVariableEvents;
        });
    }

    private preeval(
        options: {
            trigger: TriggerWithId;
        },
        variable: EvaluatedRegisteredVariable
    ): void {
        if (!variable.triggers) {
            return;
        }

        const optionsTrigger = options.trigger ?? { type: null } as Trigger;
        const display = options.trigger.type ? options.trigger.type.toLowerCase() : "unknown trigger";

        const varTrigger = variable.triggers[optionsTrigger.type];
        if (varTrigger == null || varTrigger === false) {
            // eslint-disable-next-line
            throw new expressionishErrs.ExpressionVariableError(
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
                // eslint-disable-next-line
                throw new expressionishErrs.ExpressionVariableError(
                    `$${variable.handle} does not support this specific trigger type: ${display}`,
                    variable.position,
                    variable.handle
                );
            }
        }
    }

    registerReplaceVariable(variable: ReplaceVariable): void {
        if (this.registeredVariableHandlers.has(variable.definition.handle)) {
            throw new TypeError(`A variable with the handle ${variable.definition.handle} already exists.`);
        }
        this.registeredVariableHandlers.set(variable.definition.handle, {
            definition: variable.definition,
            handle: variable.definition.handle,
            argsCheck: variable.argsCheck,
            evaluator: variable.evaluator,
            triggers: variable.definition.triggers,
            getSuggestions: variable.getSuggestions
        });

        this.variableAndAliasHandlers = this.generateVariableAndAliasHandlers();

        logger.debug(`Registered replace variable ${variable.definition.handle}`);

        this.emit("replaceVariableRegistered", variable);

        frontendCommunicator.send("replace-variable-registered", variable.definition);
    }

    unregisterReplaceVariable(handle: string): void {
        if (!this.registeredVariableHandlers.has(handle)) {
            logger.warn(`A variable with the handle ${handle} does not exist.`);
            return;
        }

        this.registeredVariableHandlers.delete(handle);
        this.variableAndAliasHandlers = this.generateVariableAndAliasHandlers();

        logger.debug(`Unregistered replace variable ${handle}`);

        this.emit("replaceVariableUnregistered", handle);

        frontendCommunicator.send("replace-variable-unregistered", handle);
    }

    getReplaceVariables(): RegisteredVariable[] {
        const variables: RegisteredVariable[] = [];
        for (const [_, value] of this.registeredVariableHandlers) {
            variables.push(value);
        }
        return variables;
    }

    private getVariablesForEvent(eventSourceId: string, eventId: string): RegisteredVariable[] {
        return this.getReplaceVariables().filter((v) => {
            if (!v.triggers) {
                return true;
            }

            const trigger = v.triggers["event"];
            return trigger === true
                || (Array.isArray(trigger)
                    && trigger.some(e => e === `${eventSourceId}:${eventId}`));
        });
    }

    getVariableHandlers(): Map<string, RegisteredVariable> {
        return this.registeredVariableHandlers;
    }

    registerLookupHandler(prefix: string, lookup: (name: string) => Evaluator): void {
        this.registeredLookupHandlers.set(prefix, lookup);
    }

    private generateVariableAndAliasHandlers(): Map<string, RegisteredVariable> {
        return Array.from(this.registeredVariableHandlers.entries()).reduce((map, [mainHandle, varConfig]) => {
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
        }, new Map<string, RegisteredVariable>());
    }

    async populateStringWithTriggerData(string = "", trigger: Trigger) {
        if (trigger == null || string === "") {
            return string;
        }

        const triggerId = getEventIdFromTriggerData(trigger);

        return await this.evaluateText(string, trigger, { type: trigger.type, id: triggerId });
    };

    async evaluateText(
        input: string,
        metadata: Record<string, unknown>,
        trigger: TriggerWithId,
        onlyValidate = false
    ): Promise<string> {
        if (input.toString().includes("$")) {
            // eslint-disable-next-line
            return await expressionish({
                handlers: this.variableAndAliasHandlers,
                expression: input,
                metadata,
                trigger,
                preeval: (
                    options: { trigger: TriggerWithId },
                    variable: EvaluatedRegisteredVariable
                ) => this.preeval(options, variable),
                lookups: this.registeredLookupHandlers,
                onlyValidate: !!onlyValidate
            }) as string;
        }
        return input;
    }

    async findAndReplaceVariables(data: Record<string, unknown>, trigger: Trigger): Promise<void> {
        const keys = Object.keys(data);

        for (const key of keys) {
            const value = data[key];
            if (value && typeof value === "string") {
                if (value.includes("$")) {
                    let replacedValue = value;
                    const triggerId = getEventIdFromTriggerData(trigger);
                    try {
                        replacedValue = await this.evaluateText(value, trigger, { type: trigger.type, id: triggerId });
                    } catch (err) {
                        logger.warn(`Unable to parse variables for value: '${value}'`, err);
                    }
                    data[key] = replacedValue;
                }
            } else if (value && typeof value === "object") {
                // recurse
                await this.findAndReplaceVariables(value as Record<string, unknown>, trigger);
            }
        }
    }

    async findAndValidateVariables(
        data: Record<string, unknown>,
        trigger: TriggerWithId,
        errors?: VariableError[]
    ): Promise<VariableError[]> {
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
                            { type: trigger?.type, id: trigger?.id },
                            true
                        );
                    } catch (error) {
                        const err = error as VariableError;
                        err.dataField = key;
                        err.rawText = value;
                        // eslint-disable-next-line
                        if (error instanceof expressionishErrs.ExpressionArgumentsError) {
                            errors.push(error as VariableError);
                            logger.debug(`Found variable error when validating`, err);
                        // eslint-disable-next-line
                        } else if (error instanceof expressionishErrs.ExpressionError) {
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
                await this.findAndValidateVariables(value as Record<string, unknown>, trigger, errors);
            }
        }

        return errors;
    }

    addEventToVariable(variableHandle: string, eventSourceId: string, eventId: string): void {
        if (this.getVariablesForEvent(eventSourceId, eventId).some(f => f.handle === variableHandle)
            || this.additionalVariableEvents[variableHandle]?.some(e => e.eventSourceId === eventSourceId && e.eventId === eventId)) {
            logger.warn(`Variable ${variableHandle} already setup for event ${eventSourceId}:${eventId}`);
            return;
        }

        const additionalEvents = this.additionalVariableEvents[variableHandle] ?? [];

        additionalEvents.push({ eventSourceId, eventId });

        this.additionalVariableEvents[variableHandle] = additionalEvents;

        logger.debug(`Added event ${eventSourceId}:${eventId} to variable ${variableHandle}`);

        frontendCommunicator.send("additional-variable-events-updated", this.additionalVariableEvents);
    }

    removeEventFromVariable(variableHandle: string, eventSourceId: string, eventId: string): void {
        let additionalEvents = this.additionalVariableEvents[variableHandle] ?? [];

        if (!additionalEvents.some(e => e.eventSourceId === eventSourceId && e.eventId === eventId)) {
            logger.warn(`Variable ${variableHandle} does not have a plugin registration for event ${eventSourceId}:${eventId}`);
            return;
        }

        additionalEvents = additionalEvents.filter(e => e.eventSourceId !== eventSourceId && e.eventId !== eventId);
        this.additionalVariableEvents[variableHandle] = additionalEvents;

        logger.debug(`Removed event ${eventSourceId}:${eventId} from variable ${variableHandle}`);

        frontendCommunicator.send("additional-variable-events-updated", this.additionalVariableEvents);
    }

    getSuggestionsForVariable(variableHandle: string, triggerType: TriggerType, triggerMeta: TriggerMeta): Awaitable<VariableUsage[]> {
        const variable = this.variableAndAliasHandlers.get(variableHandle);

        if (variable?.getSuggestions) {
            try {
                return variable.getSuggestions(triggerType, triggerMeta);
            } catch (err) {
                logger.error("Error occurred while getting variable suggestions.", err);
                return [];
            }
        }

        return [];
    }
}

const manager = new ReplaceVariableManager();

// custom variable shorthand
manager.registerLookupHandler("$", name => ({
    evaluator: (_, ...path: string[]) => {
        let result = CustomVariableManager.getCustomVariable(name);
        for (const item of path) {
            if (result == null) {
                return null;
            }
            result = result[item] as Record<string, unknown>;
        }
        return result == null ? null : result;
    }
}));

// Effect Output shorthand
manager.registerLookupHandler("&", name => ({
    evaluator: (trigger, ...path: string[]) => {
        let result = trigger.effectOutputs;
        if (result != null) {
            result = result[name] as Record<string, unknown>;
            for (const item of path) {
                if (result == null) {
                    return null;
                }
                result = result[item] as Record<string, unknown>;
            }
            return result == null ? null : result;
        }
        return null;
    }
}));

// Preset effect Args shorthand
manager.registerLookupHandler("#", name => ({
    evaluator: (trigger) => {
        const arg = (trigger.metadata?.presetListArgs || {})[name] as string;
        return arg == null ? null : arg;
    }
}));

// Macro Args shorthand
manager.registerLookupHandler("^", name => ({
    evaluator: (trigger: MacroTrigger, ...args) => {
        const { macroArgs, macroArgNames } = trigger;
        if (
            (args == null || args.length === 0) &&
            macroArgs != null &&
            macroArgNames != null &&
            typeof name === "string"
        ) {
            const namedArgIdx = macroArgNames.findIndex(item => item === name);
            if (namedArgIdx > -1) {
                return macroArgs[namedArgIdx];
            }
        }
    }
}));

// Macro shorthand
manager.registerLookupHandler("%", name => ({
    evaluator: (trigger: Trigger, ...macroArgs) => {
        const macro = macroManager.getMacroByName(name);
        if (macro != null) {
            return manager.evaluateText(
                macro.expression,
                { ...trigger, macro, macroArgs, macroArgNames: macro.argNames },
                trigger,
                false
            );
        }
    }
}));

// Global Value shorthand
manager.registerLookupHandler("!", name => ({
    evaluator: () => {
        const globalValues = SettingsManager.getSetting("GlobalValues") ?? [];
        return globalValues.find(v => v.name === name)?.value;
    }
}));

export { manager as ReplaceVariableManager };