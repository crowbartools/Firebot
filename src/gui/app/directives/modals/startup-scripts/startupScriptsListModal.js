"use strict";

(function() {
    angular.module("firebotApp").component("startupScriptsListModal", {
        template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Startup Scripts</h4>
            </div>
            <div class="modal-body">

                <div class="list-group" style="margin-bottom: 0;">
                    <span class="muted" ng-show="$ctrl.sss.getStartupScripts().length === 0">No startup scripts added.</span>
                    <div class="list-group-item flex-row-center jspacebetween" ng-repeat="script in $ctrl.sss.getStartupScripts() track by script.id">
                        <div>
                            <h4 class="list-group-item-heading">{{script.name}}</h4>
                            <p class="list-group-item-text muted">({{script.scriptName}})</p>
                        </div>
                        <div style="font-size:17px">
                            <button class="btn btn-default" style="margin-right: 10px" ng-click="$ctrl.showAddOrEditStartupScriptModal(script)">Edit</button>
                            <span uib-tooltip="Remove Startup Script" tooltip-append-to-body="true" class="clickable" style="color:red;" ng-click="$ctrl.removeStartupScript(script)">
                                <i class="fas fa-trash-alt"></i>
                            </span>    
                        </div>
                    </div>
                </div>

                <div class="muted" style="margin-top: 10px; font-size: 11px;" ng-show="$ctrl.sss.getStartupScripts().length > 0"><b>Note</b>: Newly added/updated scripts wont take affect until Firebot is restarted.</div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary pull-left" ng-click="$ctrl.showAddOrEditStartupScriptModal();">Add New Script</button>
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
                }).then(confirmed => {
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
                    closeCallback: resp => {
                        const { scriptData } = resp;
                        startupScriptsService.saveStartupScriptData(scriptData);
                    }
                });
            };
        }
    });
}());
