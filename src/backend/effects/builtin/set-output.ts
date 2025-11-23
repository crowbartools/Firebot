import type { EffectType } from "../../../types";
import logger from "../../logwrapper";

const resolveDataForOutput = (newData: unknown, currentData?: unknown, propertyPath?: string): unknown => {
    try {
        newData = JSON.parse(newData as string);
    } catch { }

    const rawData = newData != null
        ? newData.toString().toLowerCase()
        : "null";

    const dataIsNull = rawData === "null" || rawData === "undefined";

    if (propertyPath == null || propertyPath.length < 1) {
        let dataToSet = dataIsNull ? undefined : newData;
        if (currentData && Array.isArray(currentData) && !Array.isArray(newData) && !dataIsNull) {
            currentData.push(newData);
            dataToSet = currentData;
        }
        return dataToSet;
    }

    if (!currentData) {
        throw new Error("No existing data to apply property path to.");
    }

    try {
        let cursor = currentData;
        const pathNodes = propertyPath.split(".");
        for (let i = 0; i < pathNodes.length; i++) {
            let node: string | number = pathNodes[i];

            // parse to int for array access
            if (!isNaN(Number(node))) {
                node = parseInt(node);
            }

            const isLastItem = i === pathNodes.length - 1;
            if (isLastItem) {

                // if data recognized as null and cursor is an array, remove index instead of setting value
                if (dataIsNull && Array.isArray(cursor) && typeof node === "number" && !isNaN(node)) {
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
    } catch (error) {
        logger.debug(`Error resolving data using property path ${propertyPath}`, error);
    }
};

const effect: EffectType<{
    data: string;
    propertyPath?: string;
    outputNames: {
        customOutput: string;
    };
}> = {
    definition: {
        id: "firebot:set-output",
        name: "Set Output",
        description: "Save data to an effect output variable that you can then use elsewhere in this effect list.",
        icon: "fad fa-sign-out",
        categories: ["scripting"],
        dependencies: [],
        outputs: [{ defaultName: "customOutput", description: "A custom output", label: "Output Name" }]
    },
    optionsTemplate: `
        <eos-container header="Output Name">
            <p class="muted">Use this name to reference this elsewhere in this effect list via <b>$effectOutput[{{effect.outputNames.customOutput || 'name'}}]</b></p>
            <input ng-model="effect.outputNames.customOutput" type="text" class="form-control" id="chat-text-setting" placeholder="Enter name" replace-variables menu-position="below">
        </eos-container>

        <eos-container header="Output Data" pad-top="true">
            <p class="muted">This is the data that will be saved to the output. Can be text or another replace phrase.</p>
            <selectable-input-editors
                editors="editors"
                initial-editor-label="initialEditorLabel"
                model="effect.data"
            />
            <p class="muted" style="font-size: 11px;"><b>Note:</b> If output data is a valid JSON string, it will be parsed into an object or array.</p>
        </eos-container>

        <eos-container header="Property Path (Optional)" pad-top="true">
            <eos-collapsable-panel show-label="Show details" hide-label="Hide details" hide-info-box="true">
                <p class="muted">If the output already has data saved in the form of an object or array, you can define a path (using dot notation) to a specific property or index to update with the above data.</p>
                <p class="muted">If a property path is provided and there is no existing data in the output, nothing happens.</p>
                <p class="muted">If no property path is provided and the existing output does NOT contain an array, the entire output is replaced. If the existing output contains an array and the new value is NOT an array, the new value will be appended to the array.</p>
                <span>Examples:</span>
                <ul>
                    <li>some.property</li>
                    <li>1</li>
                    <li>1.value</li>
                </ul>
            </eos-collapsable-panel>
            <input ng-model="effect.propertyPath" type="text" class="form-control" id="propertyPath" placeholder="Enter path">
        </eos-container>

        <eos-container pad-top="true">
            <div class="effect-info alert alert-info">
                Effect outputs are local to the current effect list and are cleared when execution completes. They are not shared globally like Custom Variables.
                <br><br>
                When using the "Run Effect List" effect, enable "Apply effect outputs to parent list" to return data from Preset Effect Lists to the parent list without relying on global variables.
            </div>
        </eos-container>
    `,
    optionsController: ($scope) => {

        if ($scope.effect.outputNames == null) {
            $scope.effect.outputNames = {
                customOutput: ""
            };
        }

        $scope.editors = [
            {
                label: "Basic",
                inputType: "text",
                useTextArea: true,
                placeholderText: "Enter output data",
                menuPosition: "under"
            },
            {
                label: "JSON",
                inputType: "codemirror",
                menuPosition: "under",
                codeMirrorOptions: {
                    mode: { name: "javascript", json: true },
                    theme: 'blackboard',
                    lineNumbers: true,
                    autoRefresh: true,
                    showGutter: true
                }
            }
        ];

        $scope.initialEditorLabel = $scope.effect?.data?.startsWith("{") || $scope.effect?.data?.startsWith("[") ? "JSON" : "Basic";
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];
        if (!effect.outputNames?.customOutput?.length) {
            errors.push("Please provide an output name.");
        }
        return errors;
    },
    getDefaultLabel: (effect) => {
        return effect.outputNames?.customOutput ?? "";
    },
    onTriggerEvent: ({ effect, outputs }) => {
        console.log("Setting effect output", effect, outputs);
        try {
            const outputData = resolveDataForOutput(effect.data, outputs?.[effect.outputNames?.customOutput], effect.propertyPath);
            return {
                success: true,
                outputs: {
                    customOutput: outputData
                }
            };
        } catch (error) {
            logger.warn("Error setting effect output data", error);
            return {
                success: false
            };
        }
    }
};

export = effect;