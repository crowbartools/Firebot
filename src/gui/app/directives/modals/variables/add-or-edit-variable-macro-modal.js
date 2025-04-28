"use strict";

(function() {
    angular.module("firebotApp")
        .component("addOrEditVariableMacroModal", {
            template: `
                <scroll-sentinel element-class="edit-macro-header"></scroll-sentinel>
                <div class="modal-header sticky-header edit-macro-header">
                    <button
                        type="button"
                        class="close"
                        aria-label="Close"
                        ng-click="$ctrl.dismiss()"
                    >
                        <i class="fal fa-times" aria-hidden="true"></i>
                    </button>
                    <h4 class="modal-title">
                        <div class="action text-4xl">{{$ctrl.isNewMacro ? 'Add New Macro' : 'Edit Macro:'}}</div>
                        <div class="text-4xl font-semibold" ng-show="!$ctrl.isNewMacro">{{$ctrl.macro.name}}</div>
                    </h4>
                </div>
                <div class="modal-body">
                    <form name="macroSettings">
                        <div class="form-group" ng-class="{'has-error': $ctrl.formFieldHasError('name')}">
                            <label for="name" class="control-label">Name</label>
                            <div style="position: relative;">
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    ng-minlength="3"
                                    ui-validate="{valid:'$ctrl.macroNameIsValid($value)', taken:'!$ctrl.macroNameIsTaken($value)'}"
                                    required
                                    class="form-control input-lg"
                                    placeholder="Give your macro a name"
                                    ng-model="$ctrl.macro.name"
                                    ng-disabled="$ctrl.nameFieldLocked"
                                    ng-style="{'padding-right': $ctrl.nameFieldLocked ? '77px' : ''}"
                                    ng-keyup="$event.keyCode == 13 && $ctrl.save()"
                                    ng-keydown="$event.keyCode != 13 ? $event:$event.preventDefault()"
                                />
                                <div
                                    style="width: 67px;size: 16px;position: absolute;top: 50%;transform: translateY(-50%);right: 10px;"
                                    class="flex items-center justify-center"
                                    ng-if="$ctrl.nameFieldLocked"
                                >
                                    <button
                                        class="btn btn-default btn-xs"
                                        ng-click="$ctrl.unlockNameField()"
                                    ><i class="fas fa-lock"></i> Locked</button>
                                </div>
                            </div>
                            <div ng-if="$ctrl.formFieldHasError('name')">
                                <span ng-if="macroSettings.name.$error.required" class="help-block">Name is required.</span>
                                <span ng-if="macroSettings.name.$error.minlength" class="help-block">Name must be 3 or more characters.</span>
                                <span ng-if="macroSettings.name.$error.valid && !macroSettings.name.$error.required && !macroSettings.name.$error.minlength" class="help-block">Invalid name format.</span>
                                <span ng-if="macroSettings.name.$error.taken" class="help-block">This name is already in use.</span>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="expression" class="control-label">Description</label>
                            <input
                                type="text"
                                id="description"
                                name="description"
                                class="form-control input-lg"
                                style="font-size: 16px; padding: 10px 16px;"
                                ng-model="$ctrl.macro.description"
                                placeholder="Optional"
                                ng-keyup="$event.keyCode == 13 && $ctrl.save()"
                                ng-keydown="$event.keyCode != 13 ? $event:$event.preventDefault()"
                            />
                        </div>

                        <div class="form-group" ng-class="{'has-error': $ctrl.formFieldHasError('expression')}">
                            <label for="expression" class="control-label">Variable Expression</label>
                            <textarea
                                type="text"
                                id="expression"
                                name="expression"
                                ng-minlength="1"
                                required
                                class="form-control input-lg"
                                style="font-size: 16px; padding: 10px 16px; height: 100px;"
                                placeholder="The variable expression"
                                rows="4"
                                cols="40"
                                ng-model="$ctrl.macro.expression"
                                replace-variables
                                menu-position="under"
                            />
                        </div>

                        <div class="form-group">
                            <label for="args" class="control-label">Arguments</label>
                            <editable-list settings="$ctrl.argListSettings" model="$ctrl.macro.argNames" />
                        </div>
                    </form>
                </div>
                <div class="modal-footer sticky-footer edit-macro-footer">
                    <button type="button" class="btn btn-danger pull-left" ng-click="$ctrl.delete()" ng-if="!$ctrl.isNewMacro">Delete</button>
                    <button type="button" class="btn btn-default" ng-click="$ctrl.dismiss()">Cancel</button>
                    <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
                </div>
                <scroll-sentinel element-class="edit-macro-footer"></scroll-sentinel>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&",
                modalInstance: "<"
            },
            controller: function($scope, ngToast, utilityService, variableMacroService) {
                const $ctrl = this;

                $ctrl.isNewMacro = true;

                $ctrl.nameFieldLocked = false;

                $ctrl.validationErrors = {};

                /**
                 * @type {import('../../../../../types/variable-macros').VariableMacro}
                 */
                $ctrl.macro = {
                    id: null,
                    name: null,
                    expression: null,
                    argNames: []
                };

                $ctrl.argListSettings = {
                    sortable: true,
                    showIndex: false,
                    hintTemplate: "$^{name}",
                    showCopyButton: true,
                    copyTemplate: "$^{name}",
                    addLabel: "Add Macro Argument",
                    editLabel: "Edit Macro Argument",
                    inputPlaceholder: "Enter Argument Name",
                    noDuplicates: true,
                    customValidators: [
                        (argName) => {
                            if (/^\d+$/.test(argName)) {
                                return {
                                    success: false,
                                    reason: "Argument Name cannot be only numbers."
                                };
                            }
                            return true;
                        },
                        (argName) => {
                            if (!/^.{2,}$/.test(argName)) {
                                return {
                                    success: false,
                                    reason: "Argument Name length must be at least 2 characters."
                                }
                            }
                            return true;
                        },
                        (argName) => {
                            if (!/^[a-z]+/.test(argName)) {
                                return {
                                    success: false,
                                    reason: "Argument Name must start with a lowercase letter."
                                }
                            }
                            return true;
                        },
                        (argName) => {
                            if (!/^[a-z][a-zA-Z0-9]+$/.test(argName)) {
                                return {
                                    success: false,
                                    reason: "Argument Name must be alphanumeric with no spaces or special characters."
                                };
                            }
                            return true;
                        }
                    ]
                };

                $ctrl.formFieldHasError = (fieldName) => {
                    return ($scope.macroSettings.$submitted || $scope.macroSettings[fieldName].$touched)
                        && $scope.macroSettings[fieldName].$invalid;
                };

                $ctrl.macroNameIsTaken = (name) => {
                    if (name == null) {
                        return false;
                    }
                    const matchingMacro = variableMacroService.getMacroByName(name);

                    if (matchingMacro != null && ($ctrl.isNewMacro || matchingMacro.id !== $ctrl.macro.id)) {
                        return true;
                    }
                    return false;
                };

                $ctrl.macroNameIsValid = (name) => {
                    if (name == null) {
                        return false;
                    }

                    return variableMacroService.isMacroNameValid(name);
                };

                $ctrl.unlockNameField = () => {
                    utilityService
                        .showConfirmationModal({
                            title: "Warning",
                            question: `If you rename this macro, any references to it in your effects will need to be updated manually. Are you sure you want to rename this macro?`,
                            confirmLabel: "Yes, rename",
                            confirmBtnType: "btn-default"
                        })
                        .then((confirmed) => {
                            if (confirmed) {
                                $ctrl.nameFieldLocked = false;
                                setTimeout(() => {
                                    angular.element("#name").focus();
                                }, 100);
                            }
                        });
                };

                $ctrl.$onInit = () => {
                    if ($ctrl.resolve.macro != null) {
                        $ctrl.macro = JSON.parse(angular.toJson($ctrl.resolve.macro));
                        $ctrl.isNewMacro = false;
                        $ctrl.nameFieldLocked = true;
                    }
                };

                $ctrl.save = () => {
                    $scope.macroSettings.$setSubmitted();
                    if ($scope.macroSettings.$invalid) {
                        return;
                    }

                    variableMacroService.saveMacro($ctrl.macro).then((successful) => {
                        if (successful) {
                            $ctrl.dismiss();
                        } else {
                            ngToast.create("Failed to save macro. Please try again or view logs for details.");
                        }
                    });
                };

                $ctrl.delete = function() {
                    if ($ctrl.isNewMacro) {
                        return;
                    }

                    utilityService
                        .showConfirmationModal({
                            title: "Delete Macro",
                            question: `Are you sure you want to delete this macro?`,
                            confirmLabel: "Delete",
                            confirmBtnType: "btn-danger"
                        })
                        .then((confirmed) => {
                            if (confirmed) {
                                variableMacroService.deleteMacro($ctrl.macro.id);
                                $ctrl.dismiss();
                            }
                        });
                };
            }
        });
})();
