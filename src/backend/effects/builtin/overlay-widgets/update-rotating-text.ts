import type { EffectType } from "../../../../types";

import overlayWidgetConfigManager from "../../../overlay-widgets/overlay-widget-config-manager";
import { LoggerCache } from "../../../logger-cache";
import { simpleClone } from "../../../utils";
import { ReplaceVariableManager } from "../../../variables/replace-variable-manager";
import type { RotatingTextWidgetConfig } from "../../../overlay-widgets/builtin-types/rotating-text/rotating-text";

const logger = LoggerCache.getLogger("Effects");

function removeTexts(
    currentTexts: string[],
    effect: {
        removeMode?: "first" | "last" | "position" | "matching";
        removePosition?: number;
        removeValue?: string;
        removeExactMatch?: boolean;
    }
): string[] {
    if (currentTexts.length === 0) {
        return currentTexts;
    }

    switch (effect.removeMode) {
        case "first":
            return currentTexts.slice(1);
        case "last":
            return currentTexts.slice(0, -1);
        case "position": {
            const position = effect.removePosition;
            if (position == null || position < 1 || position > currentTexts.length) {
                // Out of range, do nothing
                return currentTexts;
            }
            const result = [...currentTexts];
            result.splice(position - 1, 1);
            return result;
        }
        case "matching": {
            const target = (effect.removeValue ?? "").trim();
            if (target.length === 0) {
                return currentTexts;
            }
            if (effect.removeExactMatch) {
                return currentTexts.filter(text => text !== target);
            }
            const needle = target.toLowerCase();
            return currentTexts.filter(text => !text.toLowerCase().includes(needle));
        }
        default:
            return currentTexts;
    }
}

const model: EffectType<{
    rotatingTextWidgetId: string;
    action: "add" | "remove" | "set";
    // The list of texts, used by the "add" and "set" actions.
    texts?: string[];
    // Whether $variables in the texts are evaluated now or left raw for the widget to evaluate live.
    variableEvaluation?: "dynamic" | "onRun";
    // How the "remove" action decides which text to remove.
    removeMode?: "first" | "last" | "position" | "matching";
    // The position to remove (1-based), used when removeMode is "position".
    removePosition?: number;
    // The text to match against, used when removeMode is "matching".
    removeValue?: string;
    // When true, "matching" only removes exact matches instead of any text that contains the value.
    removeExactMatch?: boolean;
}> = {
    definition: {
        id: "firebot:update-rotating-text",
        name: "Update Rotating Text",
        description: "Add, remove, or replace the texts shown by a Rotating Text overlay widget.",
        icon: "fad fa-text",
        categories: ["overlay", "advanced"],
        dependencies: [],
        keysExemptFromAutoVariableReplacement: ['texts']
    },
    optionsTemplate: `
        <eos-container ng-hide="hasRotatingTextWidgets">
            <p>You need to create a Rotating Text Overlay Widget to use this effect! Go to the <b>Overlay Widgets</b> tab to create one.</p>
        </eos-container>
        <div ng-show="hasRotatingTextWidgets">
            <eos-container header="Rotating Text Widget">
                <firebot-overlay-widget-select
                    overlay-widget-types="['firebot:rotating-text']"
                    ng-model="effect.rotatingTextWidgetId"
                />
            </eos-container>

            <div ng-show="effect.rotatingTextWidgetId">
                <eos-container header="Action" pad-top="true">
                    <firebot-radio-cards
                        options="actions"
                        ng-model="effect.action"
                        grid-columns="3"
                    ></firebot-radio-cards>
                </eos-container>

                <div ng-show="effect.action === 'add' || effect.action === 'set'">
                    <eos-container header="{{ valueHeader() }}" pad-top="true">
                        <editable-list settings="textListSettings" model="effect.texts" />
                        <p class="muted" style="margin-top: 5px">Each entry is one rotating text. Supports variables.</p>
                    </eos-container>

                    <eos-container header="Variable Evaluation" pad-top="true">
                        <firebot-radios
                            options="variableEvaluationOptions"
                            model="effect.variableEvaluation"
                        />
                    </eos-container>
                </div>

                <div ng-show="effect.action === 'remove'">
                    <eos-container header="What to Remove" pad-top="true">
                        <firebot-radio-cards
                            options="removeModes"
                            ng-model="effect.removeMode"
                            grid-columns="2"
                        ></firebot-radio-cards>
                    </eos-container>

                    <eos-container header="Position" pad-top="true" ng-show="effect.removeMode === 'position'">
                        <firebot-input
                            model="effect.removePosition"
                            input-type="number"
                            placeholder-text="Enter a position"
                        />
                        <p class="muted" style="margin-top: 5px">1 removes the first text, 2 the second, and so on. Nothing happens if the position is past the end of the list.</p>
                    </eos-container>

                    <eos-container header="Text to Match" pad-top="true" ng-show="effect.removeMode === 'matching'">
                        <firebot-input
                            model="effect.removeValue"
                            use-text-area="true"
                            placeholder-text="Enter text to match"
                        />
                        <p class="muted" style="margin-top: 5px">By default, any rotating text that <b>contains</b> this value (case-insensitive) is removed.</p>
                        <firebot-checkbox
                            model="effect.removeExactMatch"
                            label="Only remove exact matches"
                            style="margin-top: 10px"
                        />
                    </eos-container>
                </div>
            </div>
        </div>
    `,
    optionsController: ($scope, overlayWidgetsService) => {
        $scope.hasRotatingTextWidgets = overlayWidgetsService.hasOverlayWidgetConfigsOfType("firebot:rotating-text");

        $scope.actions = [
            {
                value: "add",
                label: "Add",
                iconClass: "fa-plus"
            },
            {
                value: "remove",
                label: "Remove",
                iconClass: "fa-minus"
            },
            {
                value: "set",
                label: "Set (Override)",
                iconClass: "fa-equals"
            }
        ];

        $scope.removeModes = [
            {
                value: "first",
                label: "First Text",
                iconClass: "fa-arrow-to-top"
            },
            {
                value: "last",
                label: "Last Text",
                iconClass: "fa-arrow-to-bottom"
            },
            {
                value: "position",
                label: "At a Position",
                iconClass: "fa-list-ol"
            },
            {
                value: "matching",
                label: "Matching Text",
                iconClass: "fa-search"
            }
        ];

        $scope.textListSettings = {
            sortable: true,
            useTextArea: true,
            addLabel: "Add Text",
            editLabel: "Edit Text",
            noneAddedText: "No texts added yet",
            trigger: $scope.trigger,
            triggerMeta: $scope.triggerMeta
        };

        $scope.variableEvaluationOptions = {
            dynamic: {
                text: "Evaluate live in the overlay",
                description: "Store each text as-is with any $variables left intact. The overlay widget re-evaluates them every time the text rotates into view, so values like $randomNumber stay fresh on each rotation."
            },
            onRun: {
                text: "Evaluate now, when this effect runs",
                description: "Replace any $variables with their current values the moment this effect runs, then store the resulting plain text. The overlay shows that same fixed text every time it rotates in."
            }
        };

        $scope.effect.variableEvaluation = $scope.effect.variableEvaluation ?? "dynamic";

        $scope.valueHeader = () => {
            return $scope.effect.action === "set" ? "New Text List" : "Texts to Add";
        };
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];
        if (effect.rotatingTextWidgetId == null) {
            errors.push("Please select a rotating text widget.");
            return errors;
        }
        if (effect.action == null) {
            errors.push("Please select an action to take.");
            return errors;
        }

        if (effect.action === "add" || effect.action === "set") {
            if (effect.texts == null || effect.texts.length === 0) {
                errors.push("Please add at least one text.");
            }
        } else if (effect.action === "remove") {
            if (effect.removeMode == null) {
                errors.push("Please choose what to remove.");
            } else if (effect.removeMode === "position" && (effect.removePosition == null || effect.removePosition < 1)) {
                errors.push("Please enter a position of 1 or greater.");
            } else if (effect.removeMode === "matching" && (effect.removeValue == null || effect.removeValue.trim().length === 0)) {
                errors.push("Please enter text to match.");
            }
        }

        return errors;
    },
    getDefaultLabel: (effect, overlayWidgetsService) => {
        const widgetName = overlayWidgetsService.getOverlayWidgetConfig(effect.rotatingTextWidgetId)?.name ?? "Unknown Widget";
        switch (effect.action) {
            case "remove":
                switch (effect.removeMode) {
                    case "first":
                        return `Remove first text from ${widgetName}`;
                    case "last":
                        return `Remove last text from ${widgetName}`;
                    case "position":
                        return `Remove text #${effect.removePosition ?? "?"} from ${widgetName}`;
                    case "matching":
                        return `Remove matching text from ${widgetName}`;
                    default:
                        return `Remove text from ${widgetName}`;
                }
            case "set":
                return `Set texts for ${widgetName}`;
            default:
                return `Add text to ${widgetName}`;
        }
    },
    onTriggerEvent: async (event) => {
        const { effect } = event;

        if (effect.rotatingTextWidgetId == null || effect.action == null) {
            return false;
        }

        const config = simpleClone(
            overlayWidgetConfigManager.getItem(effect.rotatingTextWidgetId)
        ) as RotatingTextWidgetConfig | null;

        if (!config) {
            logger.warn(`Failed to update Rotating Text ${effect.rotatingTextWidgetId} because it does not exist.`);
            return false;
        }

        const currentTexts = config.settings?.texts ?? [];
        let newTexts: string[];

        if (effect.action === "add" || effect.action === "set") {
            let texts = (effect.texts ?? [])
                .map(text => text?.trim() ?? "")
                .filter(text => text.length > 0);

            if (effect.variableEvaluation === "onRun") {
                texts = (await Promise.all(
                    texts.map(text => ReplaceVariableManager.populateStringWithTriggerData(text, {
                        ...event.trigger,
                        effectOutputs: event.outputs
                    }))
                ))
                    .map(text => text.trim())
                    .filter(text => text.length > 0);
            }

            if (effect.action === "add") {
                if (texts.length === 0) {
                    // Nothing to add.
                    return true;
                }
                newTexts = [...currentTexts, ...texts];
            } else {
                newTexts = texts;
            }
        } else if (effect.action === "remove") {
            newTexts = removeTexts(currentTexts, effect);
        } else {
            return false;
        }

        config.settings = {
            ...config.settings,
            texts: newTexts
        };

        overlayWidgetConfigManager.saveWidgetConfig(config);

        return true;
    }
};

export = model;
