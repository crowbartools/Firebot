"use strict";

import type { FirebotComponent } from "../../../../types";


type Bindings = {
    name: string;
    label: string;
    description?: string;
    isRequired?: boolean;
    errorMessages?: string[];
    hint?: string;
};

type Controller = {
    hasError: boolean;
};

(function () {

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { marked } = require("marked");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { sanitize } = require("dompurify");


    const firebotFormGroup: FirebotComponent<Bindings, Controller> = {
        bindings: {
            name: "@",
            label: "@",
            description: "@?",
            isRequired: "<?",
            errorMessages: "<?",
            hint: "@?"
        },
        transclude: true,
        template: `
         <div class="form-group" ng-class="{'has-error': $ctrl.hasError}">
            <label
                ng-if="$ctrl.label"
                for="{{$ctrl.name}}"
                class="control-label markdown-container"
                ng-bind-html="$ctrl.label"
            ></label>

            <div
                ng-if="$ctrl.description"
                style="padding-bottom: 5px;font-size: 13px;font-weight: 100;opacity:0.8;"
                class="markdown-container"
                ng-bind-html="$ctrl.description"
            ></div>

            <div ng-transclude></div>

            <div
                ng-if="$ctrl.hint != null && $ctrl.hint !== ''"
                class="muted markdown-container"
                style="font-size:12px; padding-top: 3px;"
                ng-bind-html="$ctrl.hint"
            ></div>

            <div ng-if="$ctrl.hasError">
                <span ng-repeat="error in $ctrl.errorMessages" class="help-block">{{ error }}</span>
            </div>
        </div>
        `,
        controller: function ($scope: angular.IScope, $sce: angular.ISCEService) {

            const $ctrl = this;

            function parseMarkdown(text: string): string {
                if (!text) {
                    return text;
                }
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return $sce.trustAsHtml(
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                    sanitize(marked(text))
                );
            }

            $ctrl.hasError = false;

            $ctrl.$onInit = $ctrl.$onChanges = () => {
                if (typeof $ctrl.label === "string") {
                    $ctrl.label = parseMarkdown($ctrl.label);
                }

                if (typeof $ctrl.description === "string") {
                    $ctrl.description = parseMarkdown($ctrl.description);
                }

                if (typeof $ctrl.hint === "string") {
                    $ctrl.hint = parseMarkdown($ctrl.hint);
                }

                $ctrl.hasError = $ctrl.errorMessages != null && $ctrl.errorMessages.length > 0;
            };
        }
    };

    // @ts-ignore
    angular
        .module('firebotApp')
        .component("firebotFormGroup", firebotFormGroup);
}());
