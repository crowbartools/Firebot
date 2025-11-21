"use strict";

(function() {
    angular.module("firebotApp").component("addOrEditHotkeyModal", {
        template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()">&times;</span></button>
                <h4 class="modal-title">
                    {{$ctrl.isNewHotkey ? 'Add New Hotkey' : 'Edit Hotkey' }}
                </h4>
            </div>
            <div class="modal-body">
                <div class="function-button-settings">
                    <div class="alert alert-info" ng-show="$ctrl.isNewHotkey">
                        <b>Important Hotkey Guidelines:</b>
                        <ul>
                            <li>Firebot cannot override hotkeys already reserved by other applications.</li>
                            <li>Firebot cannot detect conflicts with hotkeys from other applications.</li>
                            <li>Binding to a single letter will prevent typing that letter in other applications.</li>
                            <li>Hotkeys are temporarily disabled while this modal is open.</li>
                        </ul>
                    </div>

                    <h4>Name</h4>
                    <input type="text" class="form-control" ng-model="$ctrl.hotkey.name" placeholder="Enter name">

                    <h4 style="margin-top:20px;">Keybind</h4>
                    <hotkey-capture on-capture="$ctrl.onHotkeyCapture(hotkey)" hotkey="$ctrl.hotkey.code"></hotkey-capture>

                    <eos-collapsable-panel show-label="Advanced" hide-label="Hide Advanced">
                        <h4>Add Virtual Button</h4>
                        <p style="margin-bottom:10px";>While you can't press these buttons on a typical keyboard, some apps can still send them in key combinations.</p>
                        <dropdown-select options="['F13', 'F14', 'F15', 'F16', 'F17', 'F18', 'F19', 'F20', 'F21', 'F22', 'F23', 'F24']" ng-init="$ctrl.virtualBtn = 'F13'" selected="$ctrl.virtualBtn"></dropdown-select>
                        <button class="btn btn-link" ng-click="$ctrl.onAddVirtualButtonToHotkey()" style="color: #092965;">Add To Hotkey</button>
                    </eos-collapsable-panel>

                    <div style="margin-top:20px;">
                        <effect-list
                            header="What should this hotkey do?"
                            effects="$ctrl.hotkey.effects"
                            trigger="hotkey"
                            trigger-meta="{ rootEffects: $ctrl.hotkey.effects }"
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
        controller: function(hotkeyService, ngToast, backendCommunicator) {
            const $ctrl = this;

            $ctrl.isNewHotkey = true;

            $ctrl.hotkey = {
                name: "",
                active: true,
                code: "",
                warning: "",
                sortTags: []
            };

            $ctrl.$onInit = () => {
                backendCommunicator.send("hotkeys:pause-hotkeys");

                if ($ctrl.resolve.hotkey) {
                    $ctrl.hotkey = JSON.parse(
                        angular.toJson($ctrl.resolve.hotkey)
                    );

                    if ($ctrl.hotkey.sortTags == null) {
                        $ctrl.hotkey.sortTags = [];
                    }

                    $ctrl.isNewHotkey = false;
                }
            };

            $ctrl.save = () => {
                if (!hotkeyValid()) {
                    return;
                }

                const successful = hotkeyService.saveHotkey($ctrl.hotkey);
                if (successful) {
                    $ctrl.close({
                        $value: {
                            hotkey: $ctrl.hotkey
                        }
                    });
                } else {
                    ngToast.create("Failed to save hotkey. Please try again or view logs for details.");
                }
            };

            $ctrl.onHotkeyCapture = (hotkey) => {
                $ctrl.hotkey.code = hotkey;
            };

            $ctrl.onAddVirtualButtonToHotkey = () => {
                const button = $ctrl.virtualBtn;
                if ($ctrl.hotkey.code != null && $ctrl.hotkey.code.length !== 0) {
                    if (!$ctrl.hotkey.code.includes(button)) {
                        $ctrl.hotkey.code += `+${button}`;
                    }
                } else {
                    $ctrl.hotkey.code = button;
                }
            };

            $ctrl.effectListUpdated = (effects) => {
                $ctrl.hotkey.effects = effects;
            };

            const hotkeyValid = () => {
                if ($ctrl.hotkey.name === "") {
                    ngToast.create("Please provide a name for the Hotkey.");
                    return false;
                }

                if ($ctrl.hotkey.code === "") {
                    ngToast.create("Please record a Hotkey.");
                    return false;
                }

                if (hotkeyService.hotkeyCodeExists($ctrl.hotkey.id, $ctrl.hotkey.code)) {
                    ngToast.create("This Hotkey already exists.");
                    return false;
                }

                return true;
            };
        }
    });
}());