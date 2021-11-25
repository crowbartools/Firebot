"use strict";
const logger = require("../logwrapper");
const profileManager = require("../../backend/common/profile-manager.js");
const fs = require("fs-extra");
const path = require("path");
const uuid = require("uuid/v4");
const sanitizeFileName = require("sanitize-filename");
const frontendCommunicator = require("../common/frontend-communicator");
const accountAccess = require("../common/account-access");

const { TriggerType } = require("../common/EffectType");
const effectRunner = require("../common/effect-runner");

const getCountersDb = () => profileManager.getJsonDbInProfile("/counters/counters");

const COUNTERS_FOLDER = profileManager.getPathInProfile("/counters/");

let counters = {};

function loadCounters() {
    let countersDb = getCountersDb();

    let countersData = countersDb.getData("/");
    if (countersData != null) {
        counters = countersData;
    }
}

function getCounterTxtFilePath(counterName) {
    const sanitizedCounterName = sanitizeFileName(counterName);
    return path.join(COUNTERS_FOLDER, `${sanitizedCounterName}.txt`);
}

function updateCounterTxtFile(counterName, counterValue) {
    if (counterName == null || counterValue === undefined || isNaN(counterValue)) {
        return Promise.resolve();
    }

    let txtFilePath = getCounterTxtFilePath(counterName);

    return fs.writeFile(txtFilePath, counterValue.toString(), 'utf8');
}


function renameCounterTxtFile(oldName, newName) {
    if (oldName == null || oldName === undefined || newName == null || newName === undefined) {
        return Promise.resolve();
    }

    let oldTxtFilePath = getCounterTxtFilePath(oldName);
    let newTxtFilePath = getCounterTxtFilePath(newName);

    return fs.rename(oldTxtFilePath, newTxtFilePath);
}

async function deleteCounterTxtFile(counterName) {
    if (counterName == null) {
        return Promise.resolve();
    }
    let txtFilePath = getCounterTxtFilePath(counterName);
    const fileExists = await fs.pathExists(txtFilePath);
    if (fileExists) {
        return fs.unlink(txtFilePath);
    }
}

function saveCounter(counter) {
    if (counter == null) {
        return;
    }

    counters[counter.id] = counter;

    const countersDb = getCountersDb();
    try {
        countersDb.push(`/${counter.id}`, counter);
    } catch (err) {
        logger.error(err);
    }
}

function deleteCounter(counterId) {
    const counter = counters[counterId];
    if (counter) {
        deleteCounterTxtFile(counter.name);
        delete counters[counterId];
    }

    const countersDb = getCountersDb();
    try {
        countersDb.delete(`/${counterId}`);
    } catch (err) {
        logger.error(err);
    }
}

function createCounter(name) {
    const counter = {
        id: uuid(),
        name: name,
        value: 0,
        saveToTxtFile: false
    };
    saveCounter(counter);
    return counter;
}

function getCounter(counterId) {
    return counters[counterId];
}

function getCounterByName(counterName) {
    if (counterName == null) {
        return null;
    }
    const countersArray = Object.values(counters);
    return countersArray.find(c => c.name.toLowerCase() === counterName.toLowerCase());
}

async function updateCounterValue(counterId, value, overridePreviousValue = false) {
    if (counterId == null || value === undefined || isNaN(value)) {
        logger.warn("Could not update counter, invalid values: ", counterId, value);
        return;
    }

    value = parseInt(value);

    const counter = getCounter(counterId);

    let newValue = overridePreviousValue ? value : counter.value + value;

    let hitMin = false, hitMax = false;
    if (counter.maximum !== undefined && counter.maximum !== null) {
        if (newValue >= counter.maximum) {
            newValue = counter.maximum;
            if (counter.value !== counter.maximum) {
                hitMax = true;
            }
        }
    }
    if (counter.minimum !== undefined && counter.minimum !== null) {
        if (newValue <= counter.minimum) {
            newValue = counter.minimum;
            if (counter.value !== counter.minimum) {
                hitMin = true;
            }
        }
    }

    if (newValue === counter.value) {
        return;
    }

    counter.value = newValue;

    saveCounter(counter);

    await updateCounterTxtFile(counter.name, counter.value);

    frontendCommunicator.send("counter-update", {
        counterId: counter.id,
        counterValue: counter.value
    });

    let effects = null;
    if (hitMin) {
        effects = counter.minimumEffects;
    } else if (hitMax) {
        effects = counter.maximumEffects;
    } else {
        effects = counter.updateEffects;
    }

    if (effects) {
        let processEffectsRequest = {
            trigger: {
                type: TriggerType.COUNTER,
                metadata: {
                    username: accountAccess.getAccounts().streamer.username,
                    counter: {
                        id: counter.id,
                        name: counter.name,
                        value: counter.value,
                        minimum: counter.minimum,
                        maximum: counter.maximum
                    }
                }
            },
            effects: effects
        };
        effectRunner.processEffects(processEffectsRequest);
    }
}

function triggerUiRefresh() {
    frontendCommunicator.send("all-counters", counters ? Object.values(counters) : []);
}


frontendCommunicator.onAsync("get-counters", async () => {
    return counters ? Object.values(counters) : [];
});

frontendCommunicator.onAsync("create-counter", async (counterName) => {
    const counter = createCounter(counterName);
    return counter;
});

frontendCommunicator.on("save-counter", async (counter) => {
    saveCounter(counter);
    updateCounterTxtFile(counter.name, counter.value);
});

frontendCommunicator.on("rename-counter", async (data) => {
    let { counterId, newName } = data;
    const counter = getCounter(counterId);

    if (counter) {
        const oldName = counter.name;
        renameCounterTxtFile(oldName, newName);

        counter.name = newName;
        saveCounter(counter);
    }
});

frontendCommunicator.on("delete-counter", async (counterId) => {
    deleteCounter(counterId);
});

exports.loadCounters = loadCounters;
exports.getCounter = getCounter;
exports.getCounterByName = getCounterByName;
exports.updateCounterValue = updateCounterValue;
exports.saveCounter = saveCounter;
exports.deleteCounter = deleteCounter;
exports.triggerUiRefresh = triggerUiRefresh;