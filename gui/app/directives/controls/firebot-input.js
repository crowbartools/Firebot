"use strict";

(function() {

    const uuid = require("uuid");

    angular
        .module('firebotApp')
        .component("firebotInput", {
            bindings: {
                inputTitle: "@",
                placeholderText: "@",
                dataType: "@",
                useTextArea: "<",
                disableVariables: "<",
                model: "="
            },
            template: `
                <div>
                    <div ng-if="$ctrl.useInputGroup" class="input-group">
                        <span class="input-group-addon" id="{{$ctrl.inputGroupId}}">{{$ctrl.inputTitle}}</span>
                        <input ng-if="!$ctrl.useTextArea" type="text" class="form-control" ng-model="$ctrl.model" placeholder="{{$ctrl.placeholderText}}"  replace-variables="{{$ctrl.dataType}}" disable-variable-menu="$ctrl.disableVariables">
                        <textarea ng-if="$ctrl.useTextArea" ng-model="$ctrl.model" class="form-control" placeholder="{{$ctrl.placeholderText}}" rows="4" cols="40"  replace-variables="{{$ctrl.dataType}}" disable-variable-menu="$ctrl.disableVariables"></textarea>
                    </div>

                    <div ng-if="!$ctrl.useInputGroup">
                        <input ng-if="!$ctrl.useTextArea" type="text" class="form-control" ng-model="$ctrl.model" placeholder="{{$ctrl.placeholderText}}"  replace-variables="{{$ctrl.dataType}}" disable-variable-menu="$ctrl.disableVariables">
                        <textarea ng-if="$ctrl.useTextArea" ng-model="$ctrl.model" class="form-control" placeholder="{{$ctrl.placeholderText}}" rows="4" cols="40"  replace-variables="{{$ctrl.dataType}}" disable-variable-menu="$ctrl.disableVariables"></textarea>
                    </div>

                </div>
            `,
            controller: function() {
                const $ctrl = this;

                $ctrl.inputGroupId = uuid();

                $ctrl.$onInit = () => {
                    $ctrl.useInputGroup = $ctrl.inputTitle != null && $ctrl.inputTitle !== '';
                };
            }
        });
}());
