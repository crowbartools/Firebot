import { ReplaceVariable } from "../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../shared/variable-constants";
import logger from "../../logwrapper";
import { app } from "electron";
import axios from "axios";

const callUrl = async (url: string) => {
    try {
        const appVersion = app.getVersion();
        const response = await axios.get(url, {
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
        handle: "rawReadApi",
        usage: "rawReadApi[url]",
        description: 'Calls the given URL and returns the response as an object.',
        examples: [
            {
                usage: 'rawReadApi[url, object.path.here]',
                description: "Traverse a JSON response object."
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER]
    },
    evaluator: async (_, url: string, responseJsonPath: string) => {
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

export = model;