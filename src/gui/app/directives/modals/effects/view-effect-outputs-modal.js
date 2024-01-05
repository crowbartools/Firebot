"use strict";

(function () {
    angular.module("firebotApp").component("viewEffectOutputsModal", {
        template: `
                <div class="modal-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Outputs of {{$ctrl.effectDefinition.name}}</h4>
                </div>
                <div class="modal-body">
                    <div class="well-dark well-sm">Some effects output data that can be referenced in other effects down the chain via a $variable.</div>
                    <div style="margin-top: 25px;">
                        <div
                            ng-repeat="output in $ctrl.effectDefinition.outputs"
                            style="margin-bottom: 15px;"
                        >
                            <div style="font-size: 16px;margin-bottom: 5px; color:#d0d0d0;">
                                {{output.label}} <tooltip text="output.description" />
                            </div>
                            <div style="display:flex">
                                <div style="font-weight: 500;font-size: 15px;">
                                    $effectOutput[{{$ctrl.effect.outputNames[output.defaultName]}}]
                                </div>
                                <div style="margin-left: 5px">
                                    <a href
                                        style="margin-right: 5px"
                                        uib-tooltip="Copy variable"
                                        append-tooltip-to-body="true"
                                        ng-click="$ctrl.copyOutputVariable(output)">
                                        <span class="iconify clickable-icon-on-dark" data-icon="mdi:content-copy"></span>
                                    </a>
                                    <i
                                        class="fas fa-edit clickable-icon-on-dark"
                                        uib-tooltip="Edit name"
                                        append-tooltip-to-body="true"
                                        ng-click="$ctrl.showEditOutputNameModal(output)"
                                    ></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">{{$ctrl.hasMadeEdits ? 'Cancel' : 'Close'}}</button>
                    <button ng-if="$ctrl.hasMadeEdits" type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
                </div>
            `,
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&"
        },
        controller: function ($rootScope, utilityService, ngToast) {
            const $ctrl = this;

            $ctrl.hasMadeEdits = false;

            $ctrl.effectDefinition = null;

            $ctrl.effect = {};

            $ctrl.showEditOutputNameModal = (output) => {
                utilityService.openGetInputModal(
                    {
                        model: $ctrl.effect.outputNames[output.defaultName],
                        label: "Rename Output",
                        saveText: "Save",
                        descriptionText: "Ensure that your output names are unique within an effect list. If two effects output to the same name, unexpected behavior may occur.",
                        validationFn: (value) => {
                            return new Promise(resolve => {
                                if (value?.trim().length < 1) {
                                    resolve(false);
                                } else {
                                    resolve(true);
                                }
                            });
                        },
                        validationText: "Name cannot be empty."
                    },
                    (newName) => {
                        $ctrl.effect.outputNames[output.defaultName] = newName;
                        $ctrl.hasMadeEdits = true;
                    });
            };

            $ctrl.copyOutputVariable = (output) => {

                const variable = `$effectOutput[${$ctrl.effect.outputNames[output.defaultName]}]`;
                $rootScope.copyTextToClipboard(variable);

                ngToast.create({
                    className: 'success',
                    content: `Copied '${variable}'!`
                });
            };

            $ctrl.$onInit = () => {
                $ctrl.effectDefinition = $ctrl.resolve.effectDefinition;
                $ctrl.effect = JSON.parse(JSON.stringify($ctrl.resolve.effect));

                $ctrl.effect.outputNames = $ctrl.effectDefinition.outputs.reduce((acc, curr) => {
                    if (!acc[curr.defaultName]) {
                        acc[curr.defaultName] = curr.defaultName;
                    }
                    return acc;
                }, $ctrl.effect.outputNames || {});
            };

            $ctrl.save = () => {
                $ctrl.close({
                    $value: {
                        outputNames: $ctrl.effect.outputNames
                    }
                });
            };
        }
    });
}());
