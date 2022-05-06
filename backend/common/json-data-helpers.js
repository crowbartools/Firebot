"use strict";

const logger = require("../logwrapper");

exports.readData = (data, propertyPath) => {
    if (data === undefined) {
        return null;
    }

    if (propertyPath == null) {
        return data;
    }

    try {
        const pathNodes = propertyPath.split(".");
        for (let i = 0; i < pathNodes.length; i++) {
            if (data == null) {
                break;
            }
            let node = pathNodes[i];
            // parse to int for array access
            if (!isNaN(node)) {
                node = parseInt(node);
            }
            data = data[node];
        }
        return data != null ? data : null;
    } catch (error) {
        logger.debug(`error getting data from custom variable ${data} using property path ${propertyPath}`);
        return null;
    }
};

exports.parseData = (newData, currentData, propertyPath) => {
    // attempt to parse data as json
    try {
        newData = JSON.parse(newData);
    } catch (error) {
        // silently fail
    }

    const dataRaw = newData != null ? newData.toString().toLowerCase() : "null";
    const dataIsNull = dataRaw === "null" || dataRaw === "undefined";

    if (propertyPath == null || propertyPath.length < 1) {
        let dataToSet = dataIsNull ? undefined : newData;
        if (currentData && Array.isArray(currentData) && !Array.isArray(newData) && !dataIsNull) {
            currentData.push(newData);
            dataToSet = currentData;
        }
        return dataToSet;
    }

    if (!currentData) {
        throw new Error("Property path is defined but there is no current data.");
    }

    let cursor = currentData;
    const pathNodes = propertyPath.split(".");
    for (let i = 0; i < pathNodes.length; i++) {
        let node = pathNodes[i];

        // parse to int for array access
        if (!isNaN(node)) {
            node = parseInt(node);
        }

        const isLastItem = i === pathNodes.length - 1;
        if (isLastItem) {
            // if data recognized as null and cursor is an array, remove index instead of setting value
            if (dataIsNull && Array.isArray(cursor) && !isNaN(node)) {
                cursor.splice(node, 1);
            } else {
                //if next node is an array and we detect we are not setting a new array or removing array, then push data to array
                if (Array.isArray(cursor[node]) && !Array.isArray(newData) && !dataIsNull) {
                    cursor[node].push(newData);
                } else {
                    cursor[node] = dataIsNull ? undefined : newData;
                }
            }
        } else {
            cursor = cursor[node];
        }
    }
    return currentData;
};