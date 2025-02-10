import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import logger from "../../../logwrapper";
import { app } from "electron";

const callUrl = async (url: string): Promise<Response> => {
    try {
        const appVersion = app.getVersion();
        const response = await fetch(url, {
            headers: {
                "User-Agent": `Firebot/${appVersion}`
            }
        });

        if (response) {
            return response;
        }
    } catch (error) {
        logger.warn(`error calling readApi url: ${url}`, error.message);
        return error.message;
    }
};

const model: ReplaceVariable = {
    definition: {
        handle: "readApi",
        usage: "readApi[url]",
        description: 'Calls the given URL and returns the response as a string.',
        examples: [
            {
                usage: 'readApi[url, object.path.here]',
                description: "Traverse a JSON response object."
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER]
    },
    evaluator: async (
        trigger: Trigger,
        url: string,
        responseJsonPath: string
    ) => {
        try {
            const content = await (await callUrl(url)).text();
            if (responseJsonPath != null) {
                if (content != null) {
                    const jsonPathNodes = responseJsonPath.split(".");
                    try {
                        let currentObject = null;
                        for (const node of jsonPathNodes) {
                            const objToTraverse = currentObject === null ? JSON.parse(content) : currentObject;
                            if (objToTraverse[node] != null) {
                                currentObject = objToTraverse[node];
                            } else {
                                currentObject = "[JSON PARSE ERROR]";
                                break;
                            }
                        }
                        return currentObject;
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

export default model;