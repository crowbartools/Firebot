import logger from "../../../logwrapper";
import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import overlayWidgetConfigManager from "../../../overlay-widgets/overlay-widget-config-manager";

const model: ReplaceVariable = {
    definition: {
        handle: "overlayWidgetState",
        usage: "overlayWidgetState[nameOrId]",
        description: 'Retrieves the state of the specified overlay widget.',
        examples: [
            {
                usage: 'overlayWidgetState[myWidget]',
                description: "Get the state of the overlay widget with ID 'myWidget'."
            },
            {
                usage: 'overlayWidgetState[myWidget, object.path.here]',
                description: "Traverse the state JSON object."
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.ALL]
    },
    evaluator: async (
        trigger: Trigger,
        nameOrId: string,
        responseJsonPath: string
    ) => {
        try {
            const widgetConfig = overlayWidgetConfigManager.getItemByName(nameOrId) ?? overlayWidgetConfigManager.getItem(nameOrId);

            if (!widgetConfig) {
                return "[WIDGET NOT FOUND]";
            }

            const widgetState = widgetConfig.state;

            if (responseJsonPath != null) {
                if (widgetState != null) {
                    const jsonPathNodes = responseJsonPath.split(".");
                    try {
                        let currentObject = null;
                        for (const node of jsonPathNodes) {
                            const objToTraverse = currentObject === null ? widgetState : currentObject;
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

            return widgetState;
        } catch (err) {
            return "[API ERROR]";
        }
    }
};

export default model;