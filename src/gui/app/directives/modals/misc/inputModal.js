'use strict';

// generic modal for asking the user for text input

(function() {
    angular
        .module('firebotApp')
        .component("inputModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title">{{$ctrl.label}}</h4>
            </div>
            <div class="modal-body">
                <div style="display: flex;flex-direction: column;justify-content: center;align-items: center;margin-top: 15px;">
                    <p ng-if="$ctrl.descriptionText">{{$ctrl.descriptionText}}</p>
                    <div style="width: 95%; position: relative;">
                        <div class="form-group" ng-class="{'has-error': $ctrl.hasValidationError}" ng-hide="$ctrl.useTextArea" >
                            <input
                                type="{{$ctrl.inputType}}"
                                class="form-control"
                                id="inputField"
                                ng-model="$ctrl.model"
                                ng-keyup="$event.keyCode == 13 && $ctrl.save() "
                                aria-describedby="helpBlock"
                                placeholder="{{$ctrl.inputPlaceholder}}"
                                replace-variables
                                menu-position="under"
                                button-position="below"
                                disable-variable-menu="$ctrl.hideVariableMenu">
                            <span id="helpBlock" class="help-block" ng-show="$ctrl.hasValidationError">{{$ctrl.validationText}}</span>
                        </div>
                        <div class="form-group" ng-class="{'has-error': $ctrl.hasValidationError}" ng-show="$ctrl.useTextArea">
                            <textarea
                                ng-show="$ctrl.useTextArea"
                                class="form-control"
                                ng-model="$ctrl.model"
                                ng-keyup="$event.keyCode == 13 && $ctrl.save() "
                                aria-describedby="helpBlock"
                                placeholder="{{$ctrl.inputPlaceholder}}"
                                replace-variables
                                menu-position="under"
                                rows="3"
                                style="width:100%"
                                disable-variable-menu="$ctrl.hideVariableMenu"></textarea>
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
                dismiss: '&',
                modalInstance: "<"
            },
            controller: function($scope, $timeout, utilityService) {
                const $ctrl = this;

                $ctrl.model = "";

                $ctrl.label = "Enter Text";
                $ctrl.inputPlaceholder = "Enter Text";
                $ctrl.saveText = "Save";
                $ctrl.validationFn = () => true;
                $ctrl.validationText = "";
                $ctrl.hasValidationError = false;
                $ctrl.inputType = "text";
                $ctrl.descriptionText = null;
                $ctrl.useTextArea = false;

                $ctrl.hideVariableMenu = true;

                $ctrl.$onInit = function () {

                    $scope.trigger = $ctrl.resolve.trigger;
                    $scope.triggerMeta = $ctrl.resolve.triggerMeta;

                    $ctrl.hideVariableMenu = $scope.trigger == null || $scope.trigger === "";

                    if ($ctrl.resolve.model !== undefined && $ctrl.resolve.model !== null) {
                        $ctrl.model = $ctrl.resolve.model;
                    }

                    if ($ctrl.resolve.inputType) {
                        $ctrl.inputType = $ctrl.resolve.inputType;
                        $ctrl.model = $ctrl.resolve.model;
                    } else {
                        if (typeof $ctrl.model == 'number') {
                            $ctrl.inputType = "number";
                            if ($ctrl.model == null || $ctrl.model === '') {
                                $ctrl.model = 0;
                            }
                        }
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

                    if ($ctrl.resolve.descriptionText) {
                        $ctrl.descriptionText = $ctrl.resolve.descriptionText;
                    }

                    if ($ctrl.resolve.useTextArea) {
                        $ctrl.useTextArea = $ctrl.resolve.useTextArea === true;
                    }

                    const modalId = $ctrl.resolve.modalId;
                    utilityService.addSlidingModal(
                        $ctrl.modalInstance.rendered.then(() => {
                            const modalElement = $(`.${modalId}`).children();
                            return {
                                element: modalElement,
                                name: "",
                                id: modalId,
                                instance: $ctrl.modalInstance
                            };
                        })
                    );

                    $scope.$on("modal.closing", function() {
                        utilityService.removeSlidingModal();
                    });

                    $timeout(() => {
                        angular.element("#inputField").trigger("focus");
                    }, 50);

                };

                $ctrl.save = function() {
                    const validate = $ctrl.validationFn($ctrl.model);

                    Promise.resolve(validate).then(valid => {

                        let successful = false;

                        if (typeof valid === "boolean" || valid === null || valid === undefined) {
                            if (valid) {
                                successful = true;
                            }
                        } else {
                            if (valid.success) {
                                successful = true;
                            } else {
                                if (valid.reason) {
                                    $ctrl.validationText = valid.reason;
                                }
                            }
                        }

                        if (successful) {
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
