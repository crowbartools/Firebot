'use strict';

// generic modal for asking the user for an ID for a third party integration

(function() {

    const { marked } = require("marked");
    const { sanitize } = require("dompurify");

    angular
        .module('firebotApp')
        .component("idEntryModal", {
            template: `
            <div class="modal-header" style="text-align: center;">
                <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss();"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title">{{$ctrl.label}}</h4>
            </div>
            <div class="modal-body">

                <div ng-show="$ctrl.hasSteps" style="margin-top: 10px;">
                    <div style="margin-bottom: 5px;opacity: 0.8;font-weight: 800;font-size: 16px;">STEPS</div>
                    <div ng-bind-html="$ctrl.steps"></div>
                </div>

                <div style="margin-top: 15px;">
                    <div ng-show="$ctrl.hasSteps" style="margin-bottom: 5px;opacity: 0.8;font-weight: 800;font-size: 16px;text-transform: uppercase;">{{$ctrl.idLabel}}</div>
                    <div style="display: flex;flex-direction: column;justify-content: center;align-items: center;">
                        <div style="width: 95%; position: relative;">
                            <div class="form-group" ng-class="{'has-error': $ctrl.hasValidationError}">
                                <textarea type="text" class="form-control" rows="2" ng-model="$ctrl.model" ng-keyup="$event.keyCode == 13 && $ctrl.save()" aria-describedby="helpBlock" placeholder="{{$ctrl.inputPlaceholder}}"></textarea>
                                <span id="helpBlock" class="help-block" ng-show="$ctrl.hasValidationError">{{$ctrl.validationText}}</span>
                            </div>
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
            controller: function($sce) {
                const $ctrl = this;

                $ctrl.model = "";

                $ctrl.label = "Enter Text";
                $ctrl.inputPlaceholder = "Enter Text";
                $ctrl.saveText = "Save";
                $ctrl.validationFn = (model) => model != null && model.length > 0;
                $ctrl.validationText = "Account ID cannot be empty!";
                $ctrl.hasValidationError = false;

                $ctrl.hasSteps = false;
                $ctrl.steps = $sce.trustAsHtml("");

                $ctrl.idLabel = "ID";

                $ctrl.$onInit = function () {
                    if ($ctrl.resolve.model) {
                        $ctrl.model = $ctrl.resolve.model;
                    }

                    if ($ctrl.resolve.label) {
                        $ctrl.label = $ctrl.resolve.label;
                    }

                    if ($ctrl.resolve.idLabel) {
                        $ctrl.idLabel = $ctrl.resolve.idLabel;
                    }
                    $ctrl.validationText = `${$ctrl.resolve.idLabel} cannot be empty!`;

                    if ($ctrl.resolve.inputPlaceholder) {
                        $ctrl.inputPlaceholder = $ctrl.resolve.inputPlaceholder;
                    }

                    if ($ctrl.resolve.saveText) {
                        $ctrl.saveText = $ctrl.resolve.saveText;
                    }

                    if ($ctrl.resolve.steps) {
                        $ctrl.steps = $sce.trustAsHtml(sanitize(marked($ctrl.resolve.steps)));
                        $ctrl.hasSteps = true;
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
