'use strict';

// generic modal for asking the user for text input

(function() {
    angular
        .module('firebotApp')
        .component("viewerSearchModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title">{{$ctrl.label}}</h4>
            </div>
            <div class="modal-body">
                <div style="display: flex;flex-direction: column;justify-content: center;align-items: center;margin-top: 15px;">
                    <div style="width: 95%; position: relative;">
                        <div class="form-group" ng-class="{'has-error': $ctrl.hasValidationError}">
                            <input type="text" class="form-control" id="newPort" ng-model="$ctrl.model" ng-keyup="$event.keyCode == 13 && $ctrl.save() " aria-describedby="helpBlock" placeholder="{{$ctrl.inputPlaceholder}}">
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
                let $ctrl = this;

                $ctrl.model = "";

                $ctrl.label = "Enter Text";
                $ctrl.inputPlaceholder = "Enter Text";
                $ctrl.saveText = "Save";
                $ctrl.validationFn = () => true;
                $ctrl.validationText = "";
                $ctrl.hasValidationError = false;

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
                    if ($ctrl.model == null || $ctrl.model === "") return;
                    let validate = $ctrl.validationFn($ctrl.model);

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
