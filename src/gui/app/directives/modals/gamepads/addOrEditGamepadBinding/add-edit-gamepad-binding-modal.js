"use strict";

(function() {
    angular.module("firebotApp").component("addOrEditGamepadBindingModal", {
        template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()">&times;</button>
                <h4 class="modal-title">
                    {{$ctrl.isNew ? 'Add Gamepad Binding' : 'Edit Gamepad Binding'}}
                </h4>
            </div>
            <div class="modal-body">
                <div class="function-button-settings">
                    <h4>Name</h4>
                    <input type="text" class="form-control" ng-model="$ctrl.binding.name" placeholder="Enter name">

                    <h4 style="margin-top: 20px;">Button</h4>
                    <gamepad-capture
                        on-capture="$ctrl.onButtonCapture(gamepadIndex, buttonIndex)"
                        button="$ctrl.binding.button"
                    ></gamepad-capture>

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
        controller: function(gamepadService, ngToast) {
            const $ctrl = this;

            $ctrl.isNew = true;
            $ctrl.binding = {
                name: "",
                active: true,
                button: null,
                gamepadIndex: null,
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

            $ctrl.onButtonCapture = (gamepadIndex, buttonIndex) => {
                $ctrl.binding.button = buttonIndex;
                $ctrl.binding.gamepadIndex = gamepadIndex;
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
                if (gamepadService.bindingExists($ctrl.binding.id, $ctrl.binding.button, $ctrl.binding.gamepadIndex)) {
                    ngToast.create("A binding for this button already exists.");
                    return;
                }

                const saved = gamepadService.saveBinding($ctrl.binding);
                if (saved) {
                    $ctrl.close({ $value: { binding: $ctrl.binding } });
                } else {
                    ngToast.create("Failed to save binding. Check the logs for details.");
                }
            };
        }
    });
}());
