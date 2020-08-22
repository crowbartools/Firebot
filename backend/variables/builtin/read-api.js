// Migration: done

"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");
const request = require("request");
const logger = require("../../logwrapper");

function callUrl(url) {
    return new Promise((resolve, reject) => {
        request(url, (error, _, body) => {
            if (error) {
                logger.warn("error calling readApi url: " + url, error);
                reject(error);
            } else {
                resolve(body);
            }
        });
    });
}

const model = {
    definition: {
        handle: "readApi",
        usage: "readApi[url]",
        description: 'Calls the given url and inserts the response.',
        examples: [
            {
                usage: 'readApi[url, object.path.here]',
                description: "Traverse a JSON response object."
            }
        ],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER]
    },
    evaluator: async (_, url, responseJsonPath) => {
        try {

            let content = await callUrl(url);

            if (responseJsonPath != null) {
                if (content != null) {
                    let jsonPathNodes = responseJsonPath.split(".");
                    try {
                        let parsedContent = JSON.parse(content);
                        let currentObject = null;
                        for (let node of jsonPathNodes) {
                            let objToTraverse = currentObject === null ? parsedContent : currentObject;
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

            return content ? content.toString() : "";
        } catch (err) {
            return "[API ERROR]";
        }
    }
};

module.exports = model;