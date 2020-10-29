"use strict";

const logger = require("../../logwrapper");
const profileManager = require("../../common/profile-manager");
const frontendCommunicator = require("../../common/frontend-communicator");

const commandAccess = require("../../chat/commands/command-access");
const countersManager = require("../../counters/counter-manager");
const effectQueueManager = require("../../effects/queues/effect-queue-manager");
const eventsAccess = require("../../events/events-access");
const presetEffectListManager = require("../../effects/preset-lists/preset-effect-list-manager");
const customRolesManager = require("../../roles/custom-roles-manager");


function importSetup(setup) {
    if (setup == null || setup.components == null) return false;

    // commands
    const commands = setup.components.commands || [];
    for (const command of commands) {
        commandAccess.saveNewCustomCommand(command);
    }
    commandAccess.triggerUiRefresh();

    // counters
    const counters = setup.components.counters || [];
    for (const counter of counters) {
        countersManager.saveCounter(counter);
        countersManager.updateCounterValue(counter.name, counter.value);
    }
    countersManager.triggerUiRefresh();

    // currencies
    const currencies = setup.components.currencies || [];
    for (const currency of currencies) {
        frontendCommunicator.send("import-currency", currency);
    }

    // effect queues
    const effectQueues = setup.components.effectQueues || [];
    for (const queue of effectQueues) {
        effectQueueManager.saveEffectQueue(queue);
    }
    effectQueueManager.triggerUiRefresh();

    // events
    const events = setup.components.events || [];
    for (const event of events) {
        eventsAccess.saveNewEventToMainEvents(event);
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
        presetEffectListManager.savePresetEffectList(presetLists);
    }
    presetEffectListManager.triggerUiRefresh();

    // timers
    const timers = setup.components.timers || [];
    for (const timer of timers) {
        frontendCommunicator.send("import-timer", timer);
    }

    // viewer roles
    const roles = setup.components.viewerRoles || [];
    for (const role of roles) {
        customRolesManager.saveCustomRole(role);
    }
    customRolesManager.triggerUiRefresh();

    return true;
}

function setupListeners() {
    frontendCommunicator.onAsync("import-setup", async (setup) => {
        return importSetup(setup);
    });
}

exports.setupListeners = setupListeners;