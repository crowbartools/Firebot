import fsp from "fs/promises";

import type { FirebotSetup, SetupImportQuestion } from "../../types/setups";
import type { Currency } from "../../types/currency";

import { CommandManager } from "../chat/commands/command-manager";
import { CounterManager } from "../counters/counter-manager";
import { EffectQueueConfigManager } from "../effects/queues/effect-queue-config-manager";
import { EventsAccess } from "../events/events-access";
import { HotkeyManager } from "../hotkeys/hotkey-manager";
import { PresetEffectListManager } from "../effects/preset-lists/preset-effect-list-manager";
import { QuickActionManager } from "../quick-actions/quick-action-manager";
import { ScheduledTaskManager } from "../timers/scheduled-task-manager";
import { SettingsManager } from "../common/settings-manager";
import { TimerManager } from "../timers/timer-manager";
import currencyAccess from "../currency/currency-access";
import customRolesManager from "../roles/custom-roles-manager";
import overlayWidgetConfigManager from "../overlay-widgets/overlay-widget-config-manager";
import rankManager from "../ranks/rank-manager";
import variableMacroManager from "../variables/macro-manager";
import frontendCommunicator from "../common/frontend-communicator";
import logger from "../logwrapper";
import { escapeRegExp } from "../utils";

export interface LoadSetupResult {
    success: boolean;
    setup?: FirebotSetup;
    error?: string;
}

class SetupManager {
    constructor() { }

    // We need this because this class doesn't get instantiated otherwise
    // Other than this, it's just all frontend listener events
    setupListeners() {
        frontendCommunicator.onAsync("setups:load-setup",
            async (setupFilePath: string) => await this.loadSetup(setupFilePath)
        );

        frontendCommunicator.onAsync("setups:create-setup",
            async ({ setupFilePath, setup }: {
                setupFilePath: string;
                setup: FirebotSetup;
            }) => await this.createSetup(setupFilePath, setup)
        );

        frontendCommunicator.onAsync("setups:import-setup",
            async ({ setup, selectedCurrency }: {
                setup: FirebotSetup;
                selectedCurrency: Currency;
            }) => await this.importSetup(setup, selectedCurrency)
        );

        frontendCommunicator.on("setups:remove-setup-components",
            ({ components }: { components: FirebotSetup["components"] }) =>
                this.removeSetupComponents(components));
    }

    private async loadSetup(setupFilePath: string): Promise<LoadSetupResult> {
        const result: LoadSetupResult = {
            success: false
        };

        let setup: FirebotSetup;

        try {
            setup = JSON.parse(await fsp.readFile(setupFilePath, { encoding: "utf8" })) as FirebotSetup;
        } catch (error) {
            logger.error("Failed to load setup file", error);
            result.error = "Failed to load setup file: cannot read file";
            return result;
        }

        if (setup?.components == null) {
            result.error = "Failed to load setup file: file is invalid";
            return result;
        }

        result.success = true;
        result.setup = setup;
        return result;
    }

    private async createSetup(setupFilePath: string, setup: FirebotSetup): Promise<boolean> {
        try {
            await fsp.writeFile(setupFilePath, JSON.stringify(setup));
            return true;
        } catch (error) {
            logger.error("Failed to create setup", error);
            return false;
        }
    }

    private findAndReplaceCurrency(data: Record<string, unknown>, currency: Currency): void {
        const entries = Object.entries(data);
        for (const [key, value] of entries) {
            if (value && typeof value === "string") {
                if (value.includes("$currency[")) {
                    data[key] = (data[key] as string).replace(/\$currency\[\w+\b/gm, `$currency[${currency.name}`);
                }
                if (value.includes("$topCurrency[")) {
                    data[key] = (data[key] as string).replace(/\$topCurrency\[\w+\b/gm, `$topCurrency[${currency.name}`);
                }
                if (value.includes("$topCurrencyUser[")) {
                    data[key] = (data[key] as string).replace(/\$topCurrencyUser\[\w+\b/gm, `$topCurrencyUser[${currency.name}`);
                }
            } else if (value && typeof value === "object") {
                const typedValue = value as Record<string, string>;
                // check for currency effect
                if (typedValue.type === "firebot:currency") {
                    typedValue.currency = currency.id;
                // check for currency restriction
                } else if (typedValue.type === "firebot:channelcurrency") {
                    typedValue.selectedCurrency = currency.id;
                }

                // recurse
                this.findAndReplaceCurrency(typedValue, currency);
            }
        }
    }

    private replaceQuestionAnswers(
        data: Record<string, unknown>,
        questions: SetupImportQuestion[]
    ): void {
        const entries = Object.entries(data);
        for (const [key, value] of entries) {
            if (value && typeof value === "string") {

                for (const question of questions) {
                    if (value.includes(question.replaceToken)) {
                        const regex = new RegExp(escapeRegExp(question.replaceToken), 'gm');
                        data[key] = (data[key] as string).replace(regex, question.answer);
                    }
                }

            } else if (value && typeof value === "object") {
            // recurse
                this.replaceQuestionAnswers(value as Record<string, unknown>, questions);
            }
        }
    }

    private replaceCurrency(components: FirebotSetup["components"], currency: Currency): void {
        for (const componentType of Object.values(components)) {
            for (const component of componentType) {
                this.findAndReplaceCurrency(component as Record<string, unknown>, currency);
            }
        }
    }

    private async importSetup(setup: FirebotSetup, selectedCurrency: Currency): Promise<boolean> {
        if (setup == null || setup.components == null) {
            return false;
        }

        if (setup.requireCurrency) {
            this.replaceCurrency(setup.components, selectedCurrency);
        }

        if (setup.importQuestions) {
            this.replaceQuestionAnswers(setup.components as Record<string, unknown>, setup.importQuestions);
        }

        // commands
        const commands = setup.components.commands ?? [];
        for (const command of commands) {
            CommandManager.saveImportedCustomCommand(command);
        }
        CommandManager.triggerUiRefresh();

        // counters
        const counters = setup.components.counters ?? [];
        for (const counter of counters) {
            CounterManager.saveItem(counter);
        }
        CounterManager.triggerUiRefresh();

        // currencies
        const currencies = setup.components.currencies || [];
        for (const currency of currencies) {
            currencyAccess.importCurrency(currency);
        }

        // effect queues
        const effectQueues = setup.components.effectQueues || [];
        for (const queue of effectQueues) {
            EffectQueueConfigManager.saveItem(queue);
        }
        EffectQueueConfigManager.triggerUiRefresh();

        // events
        const events = setup.components.events || [];
        for (const event of events) {
            EventsAccess.saveNewEventToMainEvents(event);
        }
        EventsAccess.triggerUiRefresh();

        // events sets
        const eventGroups = setup.components.eventGroups || [];
        for (const eventGroup of eventGroups) {
            EventsAccess.saveGroupFromImport(eventGroup);
        }
        EventsAccess.triggerUiRefresh();

        // hotkeys
        for (const hotkey of setup.components.hotkeys || []) {
            HotkeyManager.saveItem(hotkey);
        }

        // preset effect lists
        const presetEffectLists = setup.components.presetEffectLists || [];
        for (const presetLists of presetEffectLists) {
            PresetEffectListManager.saveItem(presetLists);
        }
        PresetEffectListManager.triggerUiRefresh();

        // timers
        const timers = setup.components.timers || [];
        for (const timer of timers) {
            TimerManager.saveItem(timer);
        }
        TimerManager.triggerUiRefresh();

        // scheduled tasks
        const scheduledTasks = setup.components.scheduledTasks || [];
        for (const scheduledTask of scheduledTasks) {
            ScheduledTaskManager.saveScheduledTask(scheduledTask);
        }
        ScheduledTaskManager.triggerUiRefresh();

        // variable macros
        const variableMacros = setup.components.variableMacros || [];
        for (const macro of variableMacros) {
            variableMacroManager.saveItem(macro);
        }
        variableMacroManager.triggerUiRefresh();

        // viewer roles
        const roles = setup.components.viewerRoles || [];
        for (const role of roles) {
            await customRolesManager.importCustomRole(role);
        }
        customRolesManager.triggerUiRefresh();

        // viewer rank ladders
        const rankLadders = setup.components.viewerRankLadders || [];
        for (const rankLadder of rankLadders) {
            rankManager.saveItem(rankLadder);
        }
        rankManager.triggerUiRefresh();

        // quick actions
        const quickActions = setup.components.quickActions || [];
        if (quickActions.length > 0) {
            for (const action of quickActions) {
                QuickActionManager.saveQuickAction(action, false);
            }
            QuickActionManager.triggerUiRefresh();
        }

        // overlay widget configs
        const overlayWidgetConfigs = setup.components.overlayWidgetConfigs ?? [];
        if (overlayWidgetConfigs.length > 0) {
            for (const config of overlayWidgetConfigs) {
                const existing = overlayWidgetConfigManager.getItem(config.id);
                overlayWidgetConfigManager.saveItem(config, existing == null);
            }
            overlayWidgetConfigManager.triggerUiRefresh();
        }

        const componentGlobalValues = setup.components.globalValues ?? [];
        if (componentGlobalValues.length > 0) {
            let globalValues = SettingsManager.getSetting("GlobalValues");

            // Remove any existing ones that are in the setup
            globalValues = globalValues.filter(v =>
                !componentGlobalValues.some(cv => cv.name === v.name)
            );

            for (const value of componentGlobalValues) {
                globalValues.push(value);
            }

            SettingsManager.saveSetting("GlobalValues", globalValues);
        }

        return true;
    }

    private removeSetupComponents(components: Partial<FirebotSetup["components"]>): boolean {
        Object.entries(components)
            .forEach(([componentType, componentList]) => {
                componentList.forEach(({ id = "" }) => {
                    switch (componentType as keyof FirebotSetup["components"]) {
                        case "commands":
                            CommandManager.deleteCustomCommand(id);
                            break;
                        case "counters":
                            CounterManager.deleteItem(id);
                            break;
                        case "currencies":
                            currencyAccess.deleteCurrency(id);
                            break;
                        case "effectQueues":
                            EffectQueueConfigManager.deleteItem(id);
                            break;
                        case "events":
                            EventsAccess.removeEventFromMainEvents(id);
                            break;
                        case "eventGroups":
                            EventsAccess.deleteGroup(id);
                            break;
                        case "hotkeys":
                            HotkeyManager.deleteItem(id);
                            break;
                        case "presetEffectLists":
                            PresetEffectListManager.deleteItem(id);
                            break;
                        case "timers":
                            TimerManager.deleteItem(id);
                            break;
                        case "scheduledTasks":
                            ScheduledTaskManager.deleteScheduledTask(id);
                            break;
                        case "variableMacros":
                            variableMacroManager.deleteItem(id);
                            break;
                        case "viewerRoles":
                            customRolesManager.deleteCustomRole(id);
                            break;
                        case "viewerRankLadders":
                            rankManager.deleteItem(id);
                            break;
                        case "quickActions":
                            QuickActionManager.deleteQuickAction(id);
                            break;
                        case "overlayWidgetConfigs":
                            overlayWidgetConfigManager.deleteItem(id);
                            break;
                        default:
                    // do nothing
                    }
                });
                if (componentType === "commands") {
                    CommandManager.triggerUiRefresh();
                } else if (componentType === "counters") {
                    CounterManager.triggerUiRefresh();
                } else if (componentType === "effectQueues") {
                    EffectQueueConfigManager.triggerUiRefresh();
                } else if (componentType === "events") {
                    EventsAccess.triggerUiRefresh();
                } else if (componentType === "eventGroups") {
                    EventsAccess.triggerUiRefresh();
                } else if (componentType === "presetEffectLists") {
                    PresetEffectListManager.triggerUiRefresh();
                } else if (componentType === "timers") {
                    TimerManager.triggerUiRefresh();
                } else if (componentType === "scheduledTasks") {
                    ScheduledTaskManager.triggerUiRefresh();
                } else if (componentType === "variableMacros") {
                    variableMacroManager.triggerUiRefresh();
                } else if (componentType === "viewerRoles") {
                    customRolesManager.triggerUiRefresh();
                } else if (componentType === "viewerRankLadders") {
                    rankManager.triggerUiRefresh();
                } else if (componentType === "quickActions") {
                    QuickActionManager.triggerUiRefresh();
                } else if (componentType === "overlayWidgetConfigs") {
                    overlayWidgetConfigManager.triggerUiRefresh();
                }
            });

        // Process GlobalValues separately
        if (components.globalValues?.length) {
            const componentGlobalValues = components.globalValues;
            let globalValues = SettingsManager.getSetting("GlobalValues");

            globalValues = globalValues.filter(v =>
                !componentGlobalValues.some(cv => cv.name === v.name)
            );

            SettingsManager.saveSetting("GlobalValues", globalValues);
        }

        return true;
    }
}

const manager = new SetupManager();

export { manager as SetupManager };