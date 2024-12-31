"use strict";

const logger = require("../../logwrapper");
const profileManager = require("../../common/profile-manager");
const frontendCommunicator = require("../../common/frontend-communicator");

const commandManager = require("../../chat/commands/command-manager");
const { CounterManager } = require("../../counters/counter-manager");
const effectQueueManager = require("../../effects/queues/effect-queue-manager");
const eventsAccess = require("../../events/events-access");
const timerManager = require("../../timers/timer-manager");
const scheduledTaskManager = require("../../timers/scheduled-task-manager");
const presetEffectListManager = require("../../effects/preset-lists/preset-effect-list-manager");
const customRolesManager = require("../../roles/custom-roles-manager");
const quickActionManager = require("../../quick-actions/quick-action-manager");
const variableMacroManager = require("../../variables/macro-manager");
const rankManager = require("../../ranks/rank-manager");
const { escapeRegExp } = require("../../utility");
const currencyAccess = require("../../currency/currency-access").default;

function findAndReplaceCurrency(data, currency) {
    const entries = Object.entries(data);
    for (const [key, value] of entries) {
        if (value && typeof value === "string") {
            if (value.includes("$currency[")) {
                data[key] = data[key].replace(/\$currency\[\w+\b/gm, `$currency[${currency.name}`);
            }
            if (value.includes("$topCurrency[")) {
                data[key] = data[key].replace(/\$topCurrency\[\w+\b/gm, `$topCurrency[${currency.name}`);
            }
            if (value.includes("$topCurrencyUser[")) {
                data[key] = data[key].replace(/\$topCurrencyUser\[\w+\b/gm, `$topCurrencyUser[${currency.name}`);
            }
        } else if (value && typeof value === "object") {

            // check for currency effect
            if (value.type === "firebot:currency") {
                value.currency = currency.id;
            // check for currency restriction
            } else if (value.type === "firebot:channelcurrency") {
                value.selectedCurrency = currency.id;
            }

            // recurse
            findAndReplaceCurrency(value, currency);
        }
    }
}

function replaceQuestionAnswers(data, questions) {
    const entries = Object.entries(data);
    for (const [key, value] of entries) {
        if (value && typeof value === "string") {

            for (const question of questions) {
                if (value.includes(question.replaceToken)) {
                    const regex = new RegExp(escapeRegExp(question.replaceToken), 'gm');
                    data[key] = data[key].replace(regex, question.answer);
                }
            }

        } else if (value && typeof value === "object") {
            // recurse
            replaceQuestionAnswers(value, questions);
        }
    }
}

function replaceCurrency(components, currency) {
    // loop through every component type (command, event, etc)
    for (const componentArray of Object.values(components)) {
        // loop through each component
        for (const component of componentArray) {
            findAndReplaceCurrency(component, currency);
        }
    }
}

async function importSetup(setup, selectedCurrency) {
    if (setup == null || setup.components == null) {
        return false;
    }

    if (setup.requireCurrency) {
        replaceCurrency(setup.components, selectedCurrency);
    }

    if (setup.importQuestions) {
        replaceQuestionAnswers(setup.components, setup.importQuestions);
    }

    // commands
    const commands = setup.components.commands || [];
    for (const command of commands) {
        commandManager.saveImportedCustomCommand(command);
    }
    commandManager.triggerUiRefresh();

    // counters
    const counters = setup.components.counters || [];
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
    const hotkeys = setup.components.hotkeys || [];
    const hotkeyDb = profileManager.getJsonDbInProfile("/hotkeys");
    try {
        const hotkeyData = hotkeyDb.getData("/");
        let currentHotkeys = [];
        if (hotkeyData != null && hotkeyData.length > 0) {
            currentHotkeys = hotkeyData;
        }
        for (const hotkey of hotkeys) {
            const index = currentHotkeys.findIndex(h => h.id === hotkey.id);
            if (index < 0) {
                currentHotkeys.push(hotkey);
            } else {
                currentHotkeys[index] = hotkey;
            }
        }
        hotkeyDb.push("/", currentHotkeys);
    } catch (err) {
        logger.error(err);
    }
    frontendCommunicator.send("import-hotkeys-update");

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
        scheduledTaskManager.saveScheduledTask(scheduledTask);
    }
    scheduledTaskManager.triggerUiRefresh();

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
            quickActionManager.saveQuickAction(action, false);
        }
        quickActionManager.triggerUiRefresh();
    }

    return true;
}

function removeSetupComponents(components) {
    Object.entries(components)
        .forEach(([componentType, componentList]) => {
            componentList.forEach((id) => {
                switch (componentType) {
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
                        frontendCommunicator.send("remove-hotkey", id);
                        break;
                    case "presetEffectLists":
                        presetEffectListManager.deleteItem(id);
                        break;
                    case "timers":
                        timerManager.deleteItem(id);
                        break;
                    case "scheduledTasks":
                        scheduledTaskManager.deleteScheduledTask(id);
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
                        quickActionManager.deleteQuickAction(id);
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
                scheduledTaskManager.triggerUiRefresh();
            } else if (componentType === "variableMacros") {
                variableMacroManager.triggerUiRefresh();
            } else if (componentType === "viewerRoles") {
                customRolesManager.triggerUiRefresh();
            } else if (componentType === "viewerRankLadders") {
                rankManager.triggerUiRefresh();
            } else if (componentType === "quickActions") {
                quickActionManager.triggerUiRefresh();
            }
        });
    return true;
}

function setupListeners() {
    frontendCommunicator.onAsync("import-setup", async ({setup, selectedCurrency}) => {
        return importSetup(setup, selectedCurrency);
    });

    frontendCommunicator.onAsync("remove-setup-components", async ({components}) => {
        return removeSetupComponents(components);
    });
}

exports.setupListeners = setupListeners;