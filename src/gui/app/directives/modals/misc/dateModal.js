'use strict';

(function() {
    angular
        .module('firebotApp')
        .component("dateModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title">{{$ctrl.label}}</h4>
            </div>
            <div class="modal-body">
                <div style="display: flex;flex-direction: column;justify-content: center;align-items: center;margin-top: 15px;">
                    <div style="width: 95%; position: relative;">
                        <div class="form-group" ng-class="{'has-error': $ctrl.hasValidationError}">
                            <div class="input-group">
                                <input type="text" class="form-control" uib-datepicker-popup="{{$ctrl.dateFormat}}" ng-model="$ctrl.model" is-open="$ctrl.datePickerOpen" datepicker-options="$ctrl.dateOptions" ng-required="true" show-button-bar="false" placeholder="{{$ctrl.inputPlaceholder}}" aria-describedby="helpBlock"/>
                                <span class="input-group-btn">
                                    <button type="button" class="btn btn-default" ng-click="$ctrl.datePickerOpen = true"><i class="fas fa-calendar"></i></button>
                                </span>
                            </div>
                            <span id="helpBlock" class="help-block" ng-show="$ctrl.hasValidationError">{{$ctrl.validationText}}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">{{$ctrl.saveText}}</button>
            </div>
            `,
            bindings: {
                resolve: '<',
                close: '&',
                dismiss: '&'
            },
            controller: function() {
                const $ctrl = this;

                const isUSLocale = firebotAppDetails.locale === "en-US";
                $ctrl.dateFormat = isUSLocale ? "MM/dd/yyyy" : "dd/MM/yyyy";

                $ctrl.model = "";

                $ctrl.label = "Enter Text";
                $ctrl.inputPlaceholder = "Enter Text";
                $ctrl.saveText = "Save";
                $ctrl.validationFn = (value) => value != null;
                $ctrl.validationText = "Please provide a date.";
                $ctrl.hasValidationError = false;
                $ctrl.inputType = "text";

                $ctrl.datePickerOpen = false;

                $ctrl.dateOptions = {
                    showWeeks: false
                };

                $ctrl.$onInit = function () {
                    if ($ctrl.resolve.model) {
                        $ctrl.model = $ctrl.resolve.model;
                    }

                    if ($ctrl.resolve.label) {
                        $ctrl.label = $ctrl.resolve.label;
                    }

                    if ($ctrl.resolve.inputPlaceholder) {
                        $ctrl.inputPlaceholder = $ctrl.resolve.inputPlaceholder;
                    }

                    if ($ctrl.resolve.saveText) {
                        $ctrl.saveText = $ctrl.resolve.saveText;
                    }

                    if ($ctrl.resolve.validationFn) {
                        $ctrl.validationFn = $ctrl.resolve.validationFn;
                    }

                    if ($ctrl.resolve.validationText) {
                        $ctrl.validationText = $ctrl.resolve.validationText;
                    }
                };

                $ctrl.save = function() {
                    const validate = $ctrl.validationFn($ctrl.model);

                    Promise.resolve(validate).then((valid) => {

                        if (valid) {
                            $ctrl.close({ $value: {
                                model: $ctrl.model
                            }});
                        } else {
                            $ctrl.hasValidationError = true;
                        }

                    });
                };
            }
        });
}());
