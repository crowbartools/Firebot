"use strict";

(function() {

    angular
        .module('firebotApp')
        .component("colorPickerInput", {
            bindings: {
                model: "=",
                label: "@?",
                style: "@"
            },
            template: `
            <div style="{{$ctrl.style}}">
                <div ng-if="$ctrl.label != null" class="input-group settings-buttontext">
                    <span class="input-group-addon" id="basic-addon3">{{$ctrl.label}}</span>
                    <color-picker
                        ng-model="$ctrl.model"
                        options="$ctrl.colorPickerOptions"
                        event-api="$ctrl.colorPickerEvents"
                    ></color-picker>
                </div>
                <color-picker
                    ng-if="$ctrl.label == null"
                    ng-model="$ctrl.model"
                    options="$ctrl.colorPickerOptions"
                    event-api="$ctrl.colorPickerEvents"
                ></color-picker>
            </div>
            `,
            controller: function() {
                let $ctrl = this;

                $ctrl.colorPickerOptions = {
                    swatchBootstrap: false,
                    inputClass: 'form-control',
                    allowEmpty: true,
                    format: "hexString",
                    placeholder: "#ffffff",
                    case: "lower",
                    alpha: false,
                    clear: {
                        show: true,
                        label: 'Clear',
                        class: "btn btn-danger clear-btn-width"
                    }
                };

                $ctrl.colorPickerEvents = {
                    onChange: (_, color) => {
                        if (color == null || color.trim() === "") {
                            $ctrl.model = null;
                        }
                    }
                };
            }
        });
}());
