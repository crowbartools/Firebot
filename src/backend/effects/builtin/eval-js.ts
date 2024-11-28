"use strict";

import { EffectType } from "../../../types/effects";
import { EffectCategory } from "../../../shared/effect-constants";
import logger from "../../logwrapper";
import { evalSandboxedJs } from "../../common/handlers/js-sandbox/sandbox-eval";

const model: EffectType<{
    code: string;
    parameters: string[];
}> = {
    definition: {
        id: "firebot:eval-js",
        name: "Evaluate JavaScript",
        description: "Evaluate a JavaScript expression",
        icon: "fab fa-js",
        categories: [EffectCategory.ADVANCED],
        dependencies: [],
        outputs: [
            {
                label: "Code Result",
                defaultName: "jsResult",
                description: "The result of the JavaScript code. Note you must use 'return' for a result to be captured."
            }
        ]
    },
    optionsTemplate: `
    <eos-container header="Code">
        <div
            ui-codemirror="{onLoad : codemirrorLoaded}"
            ui-codemirror-opts="editorSettings"
            ng-model="effect.code"
            replace-variables
            menu-position="under">
        </div>
    </eos-container>

    <eos-container header="Parameters" pad-top="true">
        <editable-list settings="parameterSettings" model="effect.parameters" />
    </eos-container>

    <eos-container>
        <div class="effect-info alert alert-info">
            Things to note:
            <ul>
                <li>JavaScript is evaluated in a sandboxed browser environment</li>
                <li>You must use <code>return</code> to have a result captured as the output</li>
                <li>Parameters can be accessed via <code>parameters[n]</code></li>
                <li>Trigger metadata can be accessed via <code>metadata.*</code></li>
            </ul>
        </div>
    </eos-container>
    `,
    optionsController: ($scope) => {
        $scope.editorSettings = {
            mode: 'javascript',
            theme: 'blackboard',
            lineNumbers: true,
            autoRefresh: true,
            showGutter: true
        };

        $scope.parameterSettings = {
            sortable: true,
            showIndex: true,
            indexZeroBased: true,
            indexTemplate: "parameters[{index}]"
        };

        $scope.codemirrorLoaded = function(_editor) {
            // Editor part
            _editor.refresh();
            const cmResize = require("cm-resize");
            cmResize(_editor, {
                minHeight: 200,
                resizableWidth: false,
                resizableHeight: true
            });
        };
    },
    optionsValidator: (effect) => {
        const errors = [];
        if (effect.code == null) {
            errors.push("Please enter some JavaScript code.");
        }
        return errors;
    },
    onTriggerEvent: async ({ effect, trigger }) => {
        try {
            const result = await evalSandboxedJs(effect.code, effect.parameters ?? [], trigger);
            return {
                success: true,
                outputs: {
                    jsResult: result
                }
            };
        } catch (err) {
            logger.error("Error evaluating JavaScript", err);
            return false;
        }
    }
};

module.exports = model;
