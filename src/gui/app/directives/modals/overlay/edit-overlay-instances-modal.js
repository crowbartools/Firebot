"use strict";

(function() {
    angular.module("firebotApp")
        .component("editOverlayInstancesModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title">Manage Overlay Instances</h4>
                </div>
                <div class="modal-body" style="padding: 0 25px 25px 25px;">
                    <p class="muted" style="margin-bottom: 20px; font-size: 14px;">
                        Overlay instances are useful for advanced setups. For example, use a separate instance for greenscreen footage that needs chroma keying without affecting your other videos and images.
                    </p>

                    <div style="margin-bottom: 20px;">

                        <!-- Default Instance -->
                        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; padding: 15px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
                            <div style="flex: 1;">
                                <div style="display: flex; align-items: center;">
                                    <i class="fas fa-star" style="color: #ffd700; margin-right: 8px; font-size: 14px;"></i>
                                    <strong style="font-size: 15px;">Default</strong>
                                    <span class="muted" style="margin-left: 8px; font-size: 12px;">Primary overlay instance</span>
                                </div>
                            </div>
                            <button class="btn btn-default btn-sm" ng-click="$ctrl.showViewUrlModal()">
                                <i class="fas fa-link" style="margin-right: 5px;"></i> View URL
                            </button>
                        </div>

                        <!-- Custom Instances -->
                        <div ng-repeat="instanceName in $ctrl.getOverlayInstances()" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; padding: 15px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
                            <div style="flex: 1;">
                                <div style="display: flex; align-items: center;">
                                    <i class="fas fa-window-restore" style="margin-right: 8px; font-size: 14px; opacity: 0.7;"></i>
                                    <strong style="font-size: 15px;">{{instanceName}}</strong>
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn btn-default btn-sm" ng-click="$ctrl.showViewUrlModal(instanceName)">
                                    <i class="fas fa-link" style="margin-right: 5px;"></i> View URL
                                </button>
                                <button class="btn btn-danger btn-sm" ng-click="$ctrl.deleteOverlayInstanceAtIndex($index)" uib-tooltip="Delete instance" tooltip-append-to-body="true">
                                    <i class="far fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Empty State -->
                        <div ng-if="$ctrl.getOverlayInstances().length === 0" style="text-align: center; padding: 30px 20px; background: rgba(255, 255, 255, 0.02); border: 1px dashed rgba(255, 255, 255, 0.15); border-radius: 6px; margin-bottom: 10px;">
                            <i class="fas fa-window-restore" style="font-size: 32px; opacity: 0.3; margin-bottom: 10px;"></i>
                            <p class="muted" style="margin: 0; font-size: 14px;">No custom overlay instances yet</p>
                        </div>
                    </div>

                    <button class="btn btn-primary" ng-click="$ctrl.showCreateInstanceModal()" style="width: 100%;">
                        <i class="fas fa-plus" style="margin-right: 5px;"></i> Create New Instance
                    </button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(settingsService, utilityService, modalFactory) {
                const $ctrl = this;

                $ctrl.getOverlayInstances = () => {
                    return settingsService.getSetting("OverlayInstances");
                };

                $ctrl.deleteOverlayInstanceAtIndex = async (index) => {
                    const instances = settingsService.getSetting("OverlayInstances");
                    const instanceName = instances[index];

                    const confirmed = await modalFactory.showConfirmationModal({
                        title: "Delete Overlay Instance",
                        question: `Are you sure you want to delete the "${instanceName}" overlay instance?`,
                        confirmLabel: "Delete",
                        confirmBtnType: "btn-danger"
                    });

                    if (confirmed) {
                        instances.splice(index, 1);
                        settingsService.saveSetting("OverlayInstances", instances);
                    }
                };

                const addOverlayInstance = (overlayInstance) => {
                    const instances = settingsService.getSetting("OverlayInstances");

                    instances.push(overlayInstance);

                    settingsService.saveSetting("OverlayInstances", instances);
                };

                $ctrl.showViewUrlModal = (instanceName) => {
                    utilityService.showOverlayInfoModal(instanceName);
                };

                $ctrl.showCreateInstanceModal = () => {
                    modalFactory.openGetInputModal({
                        model: "",
                        label: "Instance Name",
                        inputPlaceholder: "Enter instance name",
                        saveText: "Create",
                        validationFn: async (value) => {
                            if (!value || value.trim() === "") {
                                return false;
                            }
                            const instances = settingsService.getSetting("OverlayInstances");
                            return !instances.includes(value);
                        },
                        validationText: "This name is invalid or already exists."
                    }, (instanceName) => {
                        if (instanceName) {
                            addOverlayInstance(instanceName);
                        }
                    });
                };
            }
        });
}());