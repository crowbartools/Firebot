
"use strict";
const logger = require('../logwrapper');
const eventManager = require("../live-events/EventManager");
const NodeCache = require("node-cache");

const cache = new NodeCache({ stdTTL: 0, checkperiod: 5 });

// This is supposed to be triggered whenever a custom variables it set to expire so that it can trigger an event in Firebot
// so that users can setup effects to be ran when a custom variable expires, say for example a host, follow, ember donation train.

cache.on("expired", function(key, value) {
    logger.info('Custom Variable expired');
    logger.info('key:' + key + ' contains: ' + value);

    eventManager.triggerEvent("firebot", "custom-variable-expired", {
        username: "Firebot",
        expiredCustomVariableName: key,
        expiredCustomVariableData: value
    });
});

cache.on("set", function(key, value) {
    logger.info('Custom Variable Created');
    logger.info('key:' + key + ' contains: ' + value);

    eventManager.triggerEvent("firebot", "custom-variable-set", {
        username: "Firebot",
        setCustomVariableName: key,
        setCustomVariableData: value
    });
});

exports.addCustomVariable = (name, data, ttl = 0, propertyPath = null) => {

    //attempt to parse data as json
    try {
        data = JSON.parse(data);
    } catch (error) {
        //silently fail
    }

    let dataRaw = data ? data.toString().toLowerCase() : "null";
    let dataIsNull = dataRaw === "null" || dataRaw === "undefined";

    let currentData = cache.get(name);

    if (propertyPath == null) {
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

exports.getCustomVariable = (name, propertyPath) => {
    let data = cache.get(name);

    if (data === undefined) {
        return null;
    }

    if (propertyPath === undefined) {
        return data;
    }

    try {
        let pathNodes = propertyPath.split(".");
        for (let i = 0; i < pathNodes.length; i++) {
            let node = pathNodes[i];
            // parse to int for array access
            if (!isNaN(node)) {
                node = parseInt(node);
            }
            data = data[node];
        }
        return data !== undefined ? data : null;
    } catch (error) {
        logger.debug(`error getting data from custom variable ${name} using property path ${propertyPath}`);
        return null;
    }
};