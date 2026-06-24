"use strict";
(function() {

    const { marked } = require("marked");
    const { sanitize } = require("dompurify");

    angular.module("firebotApp").component("fbParamBoolean", {
        bindings: {
            schema: '<',
            value: '<',
            onInput: '&',
            onTouched: '&'
        },
        template: `
          <div ng-if="!$ctrl.schema.useSwitch">
            <label class="control-fb control--checkbox" style="font-weight: 600;">
            <div class="flex items-center">
                <span ng-if="$ctrl.title" ng-bind-html="$ctrl.title" class="markdown-container"></span>
                <tooltip ng-if="$ctrl.description" class="ml-2" text="$ctrl.description"></tooltip>
            </div>
              <input type="checkbox" ng-click="$ctrl.local = !$ctrl.local" ng-checked="$ctrl.local" aria-label="...">
              <div class="control__indicator"></div>
            </label>
          </div>
          <div ng-if="$ctrl.schema.useSwitch" class="flex-row jspacebetween" style="align-items: center;">
            <div>
                <label ng-if="$ctrl.title" class="control-label markdown-container" style="margin:0;" ng-bind-html="$ctrl.title"></label>
                <p ng-if="$ctrl.description" class="help-block">{{$ctrl.description}}</p>
            </div>
            <div>
                <toggle-button toggle-model="$ctrl.local" auto-update-value="true" font-size="32"></toggle-button>
            </div>
          </div>
        `,
        controller: function($scope, $sce) {
            const $ctrl = this;

            $ctrl.title = null;
            $ctrl.description = null;

            function parseMarkdown(text) {
                if (!text) {
                    return text;
                }
                return $sce.trustAsHtml(
                    sanitize(marked(text))
                );
            }

            function setTitleAndDescription() {
                $ctrl.title = parseMarkdown($ctrl.schema.title);
                $ctrl.description = $ctrl.schema.description;
            }

            $ctrl.$onInit = function() {
                $ctrl.local = $ctrl.value;
                setTitleAndDescription();
            };

            $ctrl.$onChanges = function(chg) {
                if (chg.value != null && chg.value.currentValue !== $ctrl.local) {
                    $ctrl.local = chg.value.currentValue;
                }
                if (chg.schema) {
                    setTitleAndDescription();
                }
            };
            $scope.$watch('$ctrl.local', (newValue) => {
                $ctrl.onTouched();
                $ctrl.onInput({ value: newValue });
            });
        }
    });
}());