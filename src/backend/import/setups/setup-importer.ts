import { FirebotSetup, SetupImportQuestion } from "../../../types/setups";
import { Currency } from "../../../types/currency";

import { CounterManager } from "../../counters/counter-manager";
import { HotkeyManager } from "../../hotkeys/hotkey-manager";
import { QuickActionManager } from "../../quick-actions/quick-action-manager";
import { ScheduledTaskManager } from "../../timers/scheduled-task-manager";
import commandManager from "../../chat/commands/command-manager";
import effectQueueManager from "../../effects/queues/effect-queue-config-manager";
import eventsAccess from "../../events/events-access";
import timerManager from "../../timers/timer-manager";
import presetEffectListManager from "../../effects/preset-lists/preset-effect-list-manager";
import customRolesManager from "../../roles/custom-roles-manager";
import variableMacroManager from "../../variables/macro-manager";
import rankManager from "../../ranks/rank-manager";
import currencyAccess from "../../currency/currency-access";
import overlayWidgetConfigManager from "../../overlay-widgets/overlay-widget-config-manager";
import frontendCommunicator from "../../common/frontend-communicator";
import { escapeRegExp } from "../../utils";

function findAndReplaceCurrency(data: Record<string, unknown>, currency: Currency): void {
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
            findAndReplaceCurrency(typedValue, currency);
        }
    }
}

function replaceQuestionAnswers(
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
            replaceQuestionAnswers(value as Record<string, unknown>, questions);
        }
    }
}

function replaceCurrency(components: FirebotSetup["components"], currency: Currency): void {
    // loop through every component type (command, event, etc)
    for (const componentType of Object.values(components)) {
        // loop through each component
        for (const component of componentType) {
            findAndReplaceCurrency(component as Record<string, unknown>, currency);
        }
    }
}

async function importSetup(setup: FirebotSetup, selectedCurrency: Currency): Promise<boolean> {
    if (setup == null || setup.components == null) {
        return false;
    }

    if (setup.requireCurrency) {
        replaceCurrency(setup.components, selectedCurrency);
    }

    if (setup.importQuestions) {
        replaceQuestionAnswers(setup.components as Record<string, unknown>, setup.importQuestions);
    }

    // commands
    const commands = setup.components.commands ?? [];
    for (const command of commands) {
        commandManager.saveImportedCustomCommand(command);
    }
    commandManager.triggerUiRefresh();

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
        effectQueueManager.saveItem(queue);
    }
    effectQueueManager.triggerUiRefresh();

    // events
    const events = setup.components.events || [];
    for (const event of events) {
        eventsAccess.saveNewEventToMainEvents(event);
    }
    eventsAccess.triggerUiRefresh();

    // events sets
    const eventGroups = setup.components.eventGroups || [];
    for (const eventGroup of eventGroups) {
        eventsAccess.saveGroupFromImport(eventGroup);
    }
    eventsAccess.triggerUiRefresh();

    // hotkeys
    for (const hotkey of setup.components.hotkeys || []) {
        HotkeyManager.addHotkey(hotkey);
    }

    // preset effect lists
    const presetEffectLists = setup.components.presetEffectLists || [];
    for (const presetLists of presetEffectLists) {
        presetEffectListManager.saveItem(presetLists);
    }
    presetEffectListManager.triggerUiRefresh();

    // timers
    const timers = setup.components.timers || [];
    for (const timer of timers) {
        timerManager.saveItem(timer);
    }
    timerManager.triggerUiRefresh();

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

    return true;
}

function removeSetupComponents(components: Partial<FirebotSetup["components"]>): boolean {
    Object.entries(components)
        .forEach(([componentType, componentList]) => {
            componentList.forEach(({ id = "" }) => {
                switch (componentType as keyof FirebotSetup["components"]) {
                    case "commands":
                        commandManager.deleteCustomCommand(id);
                        break;
                    case "counters":
                        CounterManager.deleteItem(id);
                        break;
                    case "currencies":
                        currencyAccess.deleteCurrency(id);
                        break;
                    case "effectQueues":
                        effectQueueManager.deleteItem(id);
                        break;
                    case "events":
                        eventsAccess.removeEventFromMainEvents(id);
                        break;
                    case "eventGroups":
                        eventsAccess.deleteGroup(id);
                        break;
                    case "hotkeys":
                        HotkeyManager.deleteHotkey(id);
                        break;
                    case "presetEffectLists":
                        presetEffectListManager.deleteItem(id);
                        break;
                    case "timers":
                        timerManager.deleteItem(id);
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
                commandManager.triggerUiRefresh();
            } else if (componentType === "counters") {
                CounterManager.triggerUiRefresh();
            } else if (componentType === "effectQueues") {
                effectQueueManager.triggerUiRefresh();
            } else if (componentType === "events") {
                eventsAccess.triggerUiRefresh();
            } else if (componentType === "eventGroups") {
                eventsAccess.triggerUiRefresh();
            } else if (componentType === "presetEffectLists") {
                presetEffectListManager.triggerUiRefresh();
            } else if (componentType === "timers") {
                timerManager.triggerUiRefresh();
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
    return true;
}

function setupListeners() {
    frontendCommunicator.onAsync("import-setup", async ({ setup, selectedCurrency }: {
        setup: FirebotSetup;
        selectedCurrency: Currency;
    }) => {
        return importSetup(setup, selectedCurrency);
    });

    frontendCommunicator.on("remove-setup-components", ({ components }: {
        components: FirebotSetup["components"];
    }) => {
        return removeSetupComponents(components);
    });
}

export { setupListeners };