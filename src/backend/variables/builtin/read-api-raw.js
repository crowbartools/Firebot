// Migration: done

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");
const logger = require("../../logwrapper");
const axios = require("axios").default;

const callUrl = async (url) => {
    try {
        const response = await axios.get(url);

        if (response) {
            return response;
        }
    } catch (error) {
        logger.warn("error calling readApi url: " + url, error.message);
        return error.message;
    }
};

const model = {
    definition: {
        handle: "rawReadApi",
        usage: "rawReadApi[url]",
        description: 'Calls the given url and inserts the response.',
        examples: [
            {
                usage: 'rawReadApi[url, object.path.here]',
                description: "Traverse a JSON response object."
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER]
    },
    evaluator: async (_, url, responseJsonPath) => {
        try {
            const content = (await callUrl(url)).data;

            if (responseJsonPath != null) {
                if (content != null) {
                    const jsonPathNodes = responseJsonPath.split(".");
                    try {
                        let currentObject = null;
                        for (const node of jsonPathNodes) {
                            const objToTraverse = currentObject === null ? content : currentObject;
                            if (objToTraverse[node] != null) {
                                currentObject = objToTraverse[node];
                            } else {
                                currentObject = "[JSON PARSE ERROR]";
                                break;
                            }
                        }
                        return currentObject ? currentObject.toString() : "";
                    } catch (err) {
                        logger.warn("error when parsing api json", err);
                        return "[JSON PARSE ERROR]";
                    }
                }
            }

            return content;
        } catch (err) {
            return "[API ERROR]";
        }
    }
};

module.exports = model;