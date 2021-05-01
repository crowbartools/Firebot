
"use strict";
const logger = require('../logwrapper');
const eventManager = require("../events/EventManager");
const NodeCache = require("node-cache");

const cache = new NodeCache({ stdTTL: 0, checkperiod: 5 });
exports._cache = cache;

cache.on("expired", function(key, value) {
    eventManager.triggerEvent("firebot", "custom-variable-expired", {
        username: "Firebot",
        expiredCustomVariableName: key,
        expiredCustomVariableData: value
    });
});

cache.on("set", function(key, value) {
    eventManager.triggerEvent("firebot", "custom-variable-set", {
        username: "Firebot",
        createdCustomVariableName: key,
        createdCustomVariableData: value
    });
});

function getVariableCacheDb() {
    const profileManager = require("../common/profile-manager");
    return profileManager
        .getJsonDbInProfile("custom-variable-cache");
}

exports.persistVariablesToFile = () => {
    const db = getVariableCacheDb();
    db.push("/", cache.data);
};

exports.loadVariablesFromFile = () => {
    const db = getVariableCacheDb();
    const data = db.getData("/");
    if (data) {
        for (const [key, {t, v}] of Object.entries(data)) {
            const now = Date.now();
            if (t && t > 0 && t < now) {
                // this var has expired
                continue;
            }
            const ttl = t === 0 ? 0 : (t - now) / 1000;
            cache.set(key, v, ttl);
        }
    }
};

exports.addCustomVariable = (name, data, ttl = 0, propertyPath = null) => {

    //attempt to parse data as json
    try {
        data = JSON.parse(data);
    } catch (error) {
        //silently fail
    }

    let dataRaw = data != null ? data.toString().toLowerCase() : "null";
    let dataIsNull = dataRaw === "null" || dataRaw === "undefined";

    let currentData = cache.get(name);

    if (propertyPath == null || propertyPath.length < 1) {
        let dataToSet = dataIsNull ? undefined : data;
        if (currentData && Array.isArray(currentData) && !Array.isArray(data) && !dataIsNull) {
            currentData.push(data);
            dataToSet = currentData;
        }
        cache.set(name, dataToSet, ttl === "" ? 0 : ttl);
    } else {
        let currentData = cache.get(name);
        if (!currentData) return;
        try {
            let cursor = currentData;
            let pathNodes = propertyPath.split(".");
            for (let i = 0; i < pathNodes.length; i++) {
                let node = pathNodes[i];

                // parse to int for array access
                if (!isNaN(node)) {
                    node = parseInt(node);
                }

                let isLastItem = i === pathNodes.length - 1;
                if (isLastItem) {

                    // if data recognized as null and cursor is an array, remove index instead of setting value
                    if (dataIsNull && Array.isArray(cursor) && !isNaN(node)) {
                        cursor.splice(node, 1);
                    } else {
                        //if next node is an array and we detect we are not setting a new array or removing array, then push data to array
                        if (Array.isArray(cursor[node]) && !Array.isArray(data) && !dataIsNull) {
                            cursor[node].push(data);
                        } else {
                            cursor[node] = dataIsNull ? undefined : data;
                        }
                    }
                } else {
                    cursor = cursor[node];
                }
            }
            cache.set(name, currentData, ttl === "" ? 0 : ttl);
        } catch (error) {
            logger.debug(`error setting data to custom variable ${name} using property path ${propertyPath}`);
        }
    }
};

exports.getCustomVariable = (name, propertyPath, defaultData = null) => {
    let data = cache.get(name);

    if (data == null) {
        return defaultData;
    }

    if (propertyPath == null) {
        return data;
    }

    try {
        let pathNodes = propertyPath.split(".");
        for (let i = 0; i < pathNodes.length; i++) {
            if (data == null) break;
            let node = pathNodes[i];
            // parse to int for array access
            if (!isNaN(node)) {
                node = parseInt(node);
            }
            data = data[node];
        }
        return data != null ? data : defaultData;
    } catch (error) {
        logger.debug(`error getting data from custom variable ${name} using property path ${propertyPath}`);
        return defaultData;
    }
};