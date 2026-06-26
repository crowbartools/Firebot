"use strict";

(function() {
    angular.module("firebotApp").component("startupScriptsListModal", {
        template: `
            <div class="modal-header sticky-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Startup Scripts</h4>
            </div>
            <div class="modal-body">

                <div class="list-group" style="margin-bottom: 0;">
                    <span class="muted" ng-show="$ctrl.sss.getStartupScripts().length === 0">No startup scripts added.</span>
                    <div ng-repeat="script in $ctrl.sss.getStartupScripts() | orderBy: 'name' track by script.id"
                        style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; padding: 15px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;"
                    >
                        <div class="flex-row-center">
                            <i class="fas fa-plug" style="margin-right: 16px; font-size: 24px; opacity: 0.7;"></i>
                            <div>
                                <h4 class="list-group-item-heading"><strong>{{script.name}}</strong></h4>
                                <p class="list-group-item-text muted">{{script.scriptName}}</p>
                            </div>
                        </div>
                        <div>
                            <button class="btn btn-default btn-lg"
                                style="margin-right: 10px"
                                ng-click="$ctrl.showAddOrEditStartupScriptModal(script)"
                                uib-tooltip="Edit Script Settings"
                                tooltip-append-to-body="true"
                            >
                                <i class="far fa-cog"></i>
                            </button>
                            <button class="btn btn-danger btn-lg"
                                ng-click="$ctrl.removeStartupScript(script)"
                                uib-tooltip="Remove Startup Script"
                                tooltip-append-to-body="true"
                            >
                                <i class="far fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="muted" style="margin-top: 10px; font-size: 11px;" ng-show="$ctrl.sss.getStartupScripts().length > 0"><b>Note</b>: Newly added/updated scripts wont take affect until Firebot is restarted.</div>
            </div>
            <div class="modal-footer sticky-footer">
                <button type="button" class="btn btn-primary" ng-click="$ctrl.showAddOrEditStartupScriptModal();" style="width: 100%">
                    <i class="fas fa-plus" style="margin-right: 5px;"></i> Add New Script
                </button>
            </div>
            `,
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&"
        },
        controller: function(startupScriptsService, utilityService) {

            const $ctrl = this;

            $ctrl.sss = startupScriptsService;

            $ctrl.$onInit = function() {};

            $ctrl.removeStartupScript = (startupScript) => {
                utilityService.showConfirmationModal({
                    title: "Remove Startup Script",
                    question: `Are you sure you want to delete the startup script '${startupScript.name}'?`,
                    confirmLabel: "Delete",
                    confirmBtnType: "btn-danger"
                }).then((confirmed) => {
                    if (confirmed) {
                        startupScriptsService.deleteStartupScriptData(startupScript.id);
                    }
                });
            };

            $ctrl.showAddOrEditStartupScriptModal = (scriptDataToEdit) => {
                utilityService.showModal({
                    component: "addOrEditStartupScriptModal",
                    windowClass: "no-padding-modal",
                    resolveObj: {
                        scriptData: () => scriptDataToEdit
                    },
                    dismissCallback: () => {
                    },
                    closeCallback: (resp) => {
                        const { scriptData } = resp;
                        startupScriptsService.saveStartupScriptData(scriptData);
                    }
                });
            };
        }
    });
}());
