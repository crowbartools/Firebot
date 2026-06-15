"use strict";

(function() {
    angular.module("firebotApp").component("addOrEditGameControllerBindingModal", {
        template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()">&times;</button>
                <h4 class="modal-title">
                    {{$ctrl.isNew ? 'Add Game Controller Binding' : 'Edit Game Controller Binding'}}
                </h4>
            </div>
            <div class="modal-body">
                <div class="function-button-settings">
                    <h4>Name</h4>
                    <input type="text" class="form-control" ng-model="$ctrl.binding.name" placeholder="Enter name">

                    <h4 style="margin-top: 20px;">Button</h4>
                    <game-controller-capture
                        on-capture="$ctrl.onButtonCapture(controllerIndex, buttonIndex)"
                        button="$ctrl.binding.button"
                    ></game-controller-capture>

                    <div style="margin-top: 20px;">
                        <effect-list
                            header="What should this button do?"
                            effects="$ctrl.binding.effects"
                            trigger="hotkey"
                            trigger-meta="{ rootEffects: $ctrl.binding.effects }"
                            update="$ctrl.effectListUpdated(effects)"
                        ></effect-list>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
            </div>
        `,
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&",
            modalInstance: "<"
        },
        controller: function(gameControllerService, ngToast) {
            const $ctrl = this;

            $ctrl.isNew = true;
            $ctrl.binding = {
                name: "",
                active: true,
                button: null,
                controllerIndex: null,
                sortTags: []
            };

            $ctrl.$onInit = () => {
                if ($ctrl.resolve.binding) {
                    $ctrl.binding = JSON.parse(angular.toJson($ctrl.resolve.binding));
                    if ($ctrl.binding.sortTags == null) {
                        $ctrl.binding.sortTags = [];
                    }
                    $ctrl.isNew = false;
                }
            };

            $ctrl.onButtonCapture = (controllerIndex, buttonIndex) => {
                $ctrl.binding.button = buttonIndex;
                $ctrl.binding.controllerIndex = controllerIndex;
            };

            $ctrl.effectListUpdated = (effects) => {
                $ctrl.binding.effects = effects;
            };

            $ctrl.save = () => {
                if ($ctrl.binding.name === "") {
                    ngToast.create("Please provide a name for the binding.");
                    return;
                }
                if ($ctrl.binding.button == null) {
                    ngToast.create("Please record a controller button.");
                    return;
                }
                if (gameControllerService.bindingExists($ctrl.binding.id, $ctrl.binding.button, $ctrl.binding.controllerIndex)) {
                    ngToast.create("A binding for this button already exists.");
                    return;
                }

                const saved = gameControllerService.saveBinding($ctrl.binding);
                if (saved) {
                    $ctrl.close({ $value: { binding: $ctrl.binding } });
                } else {
                    ngToast.create("Failed to save binding. Check the logs for details.");
                }
            };
        }
    });
}());
