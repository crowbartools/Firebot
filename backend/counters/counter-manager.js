"use strict";
const logger = require("../logwrapper");
const profileManager = require("../../backend/common/profile-manager.js");
const fs = require("fs-extra");
const path = require("path");
const uuid = require("uuid/v4");
const sanitizeFileName = require("sanitize-filename");
const frontendCommunicator = require("../common/frontend-communicator");

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

    return fs.writeFile(txtFilePath, counterValue, 'utf8');
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
    if (counter == null) return;

    counters[counter.id] = counter;

    const countersDb = getCountersDb();
    try {
        countersDb.push(`/${counter.id}`, counter);
    } catch (err) {
        logger.error(err);
    }

    if (!counter.saveToTxtFile) {
        deleteCounterTxtFile(counter.name);
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
    if (counterName == null) return null;
    const countersArray = Object.values(counters);
    return countersArray.find(c => c.name.toLowerCase() === counterName.toLowerCase());
}

async function updateCounterValue(counterId, value, overridePreviousValue = false) {
    if (counterId == null || value === undefined || isNaN(value)) {
        logger.warning("Could not update counter, invalid values: ", counterId, value);
        return;
    }

    value = parseInt(value);

    const counter = getCounter(counterId);

    const newValue = overridePreviousValue ? value : counter.value + value;
    counter.value = newValue;

    saveCounter(counter);

    if (counter.saveToTxtFile) {
        await updateCounterTxtFile(counter.name, counter.value);
    }

    frontendCommunicator.send("counter-update", {
        counterId: counter.id,
        counterValue: counter.value
    });
}

frontendCommunicator.on("create-counter-txt-file", counterId => {
    const counter = getCounter(counterId);
    if (counter == null) return;
    updateCounterTxtFile(counter.name, counter.value);
});

frontendCommunicator.on("delete-counter-txt-file", counterId => {
    const counter = getCounter(counterId);
    if (counter == null) return;
    deleteCounterTxtFile(counter.name);
});

frontendCommunicator.onAsync("get-counters", async () => {
    return counters ? Object.values(counters) : [];
});

frontendCommunicator.onAsync("create-counter", async (counterName) => {
    const counter = createCounter(counterName);
    return counter;
});

frontendCommunicator.on("save-counter", async (counter) => {
    saveCounter(counter);
    if (counter.saveToTxtFile) {
        updateCounterTxtFile(counter.name, counter.value);
    }
});

frontendCommunicator.on("delete-counter", async (counterId) => {
    deleteCounter(counterId);
});

exports.loadCounters = loadCounters;
exports.getCounter = getCounter;
exports.getCounterByName = getCounterByName;
exports.updateCounterValue = updateCounterValue;