"use strict";

(function() {

    const uuid = require("uuid");

    angular
        .module('firebotApp')
        .component("firebotInput", {
            bindings: {
                inputTitle: "@",
                titleTooltip: "@?",
                placeholderText: "@",
                inputType: "@?",
                dataType: "@?",
                useTextArea: "<",
                disableVariables: "<",
                onInputUpdate: "&",
                model: "=",
                style: "@",
                menuPosition: "@?",
                class: "@?"
            },
            template: `
                <div style="{{$ctrl.style}}" class="{{$ctrl.class}}">
                    <div ng-if="$ctrl.useInputGroup" class="input-group">
                        <span class="input-group-addon" id="{{$ctrl.inputGroupId}}">{{$ctrl.inputTitle}}<tooltip ng-if="$ctrl.titleTooltip != null" text="$ctrl.titleTooltip"></tooltip></span>
                        <input ng-if="!$ctrl.useTextArea" type="{{$ctrl.disableVariables ? $ctrl.inputType || 'text' : 'text'}}" class="form-control" ng-model="$ctrl.model" ng-change="$ctrl.onChange($ctrl.model)" placeholder="{{$ctrl.placeholderText}}"  replace-variables="{{$ctrl.dataType}}" disable-variable-menu="$ctrl.disableVariables" menu-position="{{$ctrl.menuPosition}}">
                        <textarea ng-if="$ctrl.useTextArea" ng-model="$ctrl.model" ng-change="$ctrl.onChange($ctrl.model)" class="form-control" placeholder="{{$ctrl.placeholderText}}" rows="4" cols="40"  replace-variables="{{$ctrl.dataType}}" disable-variable-menu="$ctrl.disableVariables" menu-position="{{$ctrl.menuPosition}}"></textarea>
                    </div>

                    <div ng-if="!$ctrl.useInputGroup">
                        <input ng-if="!$ctrl.useTextArea" type="{{$ctrl.disableVariables ? $ctrl.inputType || 'text' : 'text'}}" class="form-control" ng-model="$ctrl.model" ng-change="$ctrl.onChange($ctrl.model)" placeholder="{{$ctrl.placeholderText}}"  replace-variables="{{$ctrl.dataType}}" disable-variable-menu="$ctrl.disableVariables" menu-position="{{$ctrl.menuPosition}}">
                        <textarea ng-if="$ctrl.useTextArea" ng-model="$ctrl.model" ng-change="$ctrl.onChange($ctrl.model)" class="form-control" placeholder="{{$ctrl.placeholderText}}" rows="4" cols="40" replace-variables="{{$ctrl.dataType}}" disable-variable-menu="$ctrl.disableVariables" menu-position="{{$ctrl.menuPosition}}"></textarea>
                    </div>

                </div>
            `,
            controller: function($timeout) {
                const $ctrl = this;

                $ctrl.inputGroupId = uuid();

                $ctrl.onChange = (model) => {
                    $ctrl.model = model;
                    $timeout(() => {
                        $ctrl.onInputUpdate();
                    }, 25);
                };

                $ctrl.$onInit = () => {
                    $ctrl.useInputGroup = $ctrl.inputTitle != null && $ctrl.inputTitle !== '';
                };
            }
        });
}());
