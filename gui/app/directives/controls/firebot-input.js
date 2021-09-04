"use strict";

(function() {

    const uuid = require("uuid");

    angular
        .module('firebotApp')
        .component("firebotInput", {
            bindings: {
                inputTitle: "@",
                placeholderText: "@",
                inputType: "@",
                dataType: "@?",
                useTextArea: "<",
                disableVariables: "<",
                onInputUpdate: "&",
                model: "=",
                style: "@",
                max: "@?",
                required: "@?",
                errorMessage: "@?"
            },
            template: `
                <div style="{{$ctrl.style}}" class="fb-input">
                    <div ng-if="$ctrl.useInputGroup" class="input-group">
                        <span class="input-group-addon" id="{{$ctrl.inputGroupId}}">{{$ctrl.inputTitle}}</span>
                        <input
                            ng-if="!$ctrl.useTextArea"
                            type="{{$ctrl.disableVariables ? $ctrl.inputType || 'text' : 'text'}}"
                            class="form-control"
                            ng-class="{'invalid': $ctrl.invalid}"
                            ng-model="$ctrl.model"
                            ng-change="$ctrl.onChange($ctrl.model)"
                            placeholder="{{$ctrl.placeholderText}}"
                            replace-variables="{{$ctrl.dataType}}"
                            disable-variable-menu="$ctrl.disableVariables"
                            max="{{$ctrl.max}}"
                        >
                        <textarea
                            ng-if="$ctrl.useTextArea"
                            ng-model="$ctrl.model"
                            ng-class="{'invalid': $ctrl.invalid}"
                            ng-change="$ctrl.onChange($ctrl.model)"
                            class="form-control"
                            placeholder="{{$ctrl.placeholderText}}"
                            rows="4"
                            cols="40"
                            replace-variables="{{$ctrl.dataType}}"
                            disable-variable-menu="$ctrl.disableVariables"
                        ></textarea>
                        <div ng-show="$ctrl.invalid" style="color: #ff4343;margin-top: 3px;">{{$ctrl.errorMessage}}</div>
                    </div>

                    <div ng-if="!$ctrl.useInputGroup">
                        <input
                            ng-if="!$ctrl.useTextArea"
                            type="{{$ctrl.disableVariables ? $ctrl.inputType || 'text' : 'text'}}"
                            class="form-control"
                            ng-class="{'invalid': $ctrl.invalid}"
                            ng-model="$ctrl.model"
                            ng-change="$ctrl.onChange($ctrl.model)"
                            placeholder="{{$ctrl.placeholderText}}"
                            replace-variables="{{$ctrl.dataType}}"
                            disable-variable-menu="$ctrl.disableVariables"
                            max="{{$ctrl.max}}"
                        >
                        <textarea
                            ng-if="$ctrl.useTextArea"
                            ng-model="$ctrl.model"
                            ng-class="{'invalid': $ctrl.invalid}"
                            ng-change="$ctrl.onChange($ctrl.model)"
                            class="form-control"
                            placeholder="{{$ctrl.placeholderText}}"
                            rows="4"
                            cols="40"
                            replace-variables="{{$ctrl.dataType}}"
                            disable-variable-menu="$ctrl.disableVariables"
                        ></textarea>
                        <div ng-show="$ctrl.invalid" style="color: red;margin-top: 3px;">{{$ctrl.errorMessage}}</div>
                    </div>

                </div>
            `,
            controller: function($timeout) {
                const $ctrl = this;

                $ctrl.inputGroupId = uuid();

                $ctrl.onChange = (model) => {
                    $ctrl.model = model;
                    $timeout(() => {
                        if ($ctrl.required && !$ctrl.model) {
                            $ctrl.invalid = true;
                            return;
                        }
                        $ctrl.invalid = false;
                        $ctrl.onInputUpdate();
                    }, 25);
                };

                $ctrl.$onInit = () => {
                    $ctrl.invalid = false;
                    $ctrl.useInputGroup = $ctrl.inputTitle != null && $ctrl.inputTitle !== '';
                };
            }
        });
}());
