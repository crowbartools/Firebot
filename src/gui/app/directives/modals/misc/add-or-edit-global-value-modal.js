"use strict";

(function() {
    angular.module("firebotApp")
        .component("addOrEditGlobalValueModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">{{$ctrl.isNew ? 'Add' : 'Edit'}} Global Value</h4>
                </div>
                <div class="modal-body">

                    <form name="globalValueInfo">

                        <div class="form-group" ng-class="{'has-error': $ctrl.formFieldHasError('name')}">
                            <label for="name" class="control-label">Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                class="form-control input-lg"
                                placeholder="Enter name"
                                ng-model="$ctrl.globalValue.name"
                                ui-validate="{valid:'$ctrl.nameIsValid($value)', taken:'!$ctrl.nameIsTaken($value)'}"
                                required
                                ng-minlength="3"
                            />
                            <div ng-if="$ctrl.formFieldHasError('name')">
                                <span ng-if="globalValueInfo.name.$error.required" class="help-block">Name is required.</span>
                                <span ng-if="globalValueInfo.name.$error.minlength" class="help-block">Name must be 3 or more characters.</span>
                                <span ng-if="globalValueInfo.name.$error.valid && !globalValueInfo.name.$error.required && !globalValueInfo.name.$error.minlength" class="help-block">Invalid name format.</span>
                                <span ng-if="globalValueInfo.name.$error.taken" class="help-block">This name is already in use.</span>
                            </div>
                        </div>

                       <firebot-checkbox
                            label="Secret"
                            tooltip="Hides the value in the UI"
                            model="$ctrl.globalValue.secret"
                        />

                        <div class="form-group" ng-class="{'has-error': $ctrl.formFieldHasError('value')}">
                            <label for="value" class="control-label">Value</label>
                            <input
                                type="{{ $ctrl.globalValue.secret ? 'password' : 'text' }}"
                                id="value"
                                name="value"
                                class="form-control input-lg"
                                placeholder="Enter value"
                                ng-model="$ctrl.globalValue.value"
                                ui-validate="'$value != null && $value.length > 0'"
                                required
                            />
                            <div ng-if="$ctrl.formFieldHasError('value')">
                                <span class="help-block">Value is required.</span>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" ng-click="$ctrl.dismiss()">Cancel</button>
                    <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function($scope, settingsService) {
                const $ctrl = this;

                $ctrl.isNew = true;

                $ctrl.globalValue = {
                    name: null,
                    secret: false,
                    value: null
                };

                $ctrl.nameIsValid = (name) => {
                    if (/^[a-z][a-z0-9]*$/i.test(name)) {
                        return true;
                    }
                    return false;
                };

                $ctrl.nameIsTaken = (name) => {
                    // check for uniqueness
                    const existing = settingsService.getSetting("GlobalValues") ?? [];
                    if ($ctrl.isNew || ($ctrl.resolve.globalValue != null && $ctrl.resolve.globalValue.name !== name)) {
                        if (existing.find(v => v.name === name) != null) {
                            return true;
                        }
                    }

                    return false;
                };

                $ctrl.formFieldHasError = (fieldName) => {
                    return ($scope.globalValueInfo.$submitted || $scope.globalValueInfo[fieldName].$touched)
                        && $scope.globalValueInfo[fieldName].$invalid;
                };

                $ctrl.$onInit = () => {
                    if ($ctrl.resolve.globalValue != null) {
                        $ctrl.globalValue = JSON.parse(angular.toJson($ctrl.resolve.globalValue));
                        $ctrl.isNew = false;
                    }
                };

                $ctrl.save = () => {
                    $scope.globalValueInfo.$setSubmitted();

                    if ($scope.globalValueInfo.$invalid) {
                        return;
                    }

                    $ctrl.close({
                        $value: {
                            globalValue: $ctrl.globalValue,
                            isNew: $ctrl.isNew,
                            previous: $ctrl.resolve.globalValue
                        }
                    });
                };
            }
        });
}());
