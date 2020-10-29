"use strict";

(function() {
    const fs = require("fs-extra");
    angular.module("firebotApp")
        .component("importSetupModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Import Setup</h4>
                </div>
                <div class="modal-body">
                    <div ng-hide="$ctrl.setupSelected">
                        <file-chooser 
                            model="$ctrl.setupFilePath" 
                            on-update="$ctrl.onFileSelected(filepath)" 
                            options="{filters: [ {name:'Firebot Setups',extensions:['firebotsetup']} ]}"
                            hide-manual-edit="true"
                        >
                        </file-chooser>
                    </div>
                    <div ng-if="$ctrl.setupSelected">
                        <div style="padding: 15px;background: #242529;border-radius: 5px;">              
                            <div class="script-name" style="font-size: 30px;font-weight: 100;">{{$ctrl.setup.name || "Unnamed Setup"}} <span class="script-version muted">v{{$ctrl.setup.version}}</span></div>
                            <div style="font-size: 13px;">by <span class="script-author">{{$ctrl.setup.author}}</span></div>
                            <div class="script-description">{{$ctrl.setup.description}}</div>
                            <button class="btn-sm btn-default" ng-click="$ctrl.resetSelectedFile()" style="margin-top: 3px;">Change</button>
                        </div>
                        <div style="margin-top: 25px;">
                            <h4 class="muted">This Setup Adds:</h4>
                            <div ng-repeat="(key, name) in $ctrl.componentTypes">
                                <div ng-repeat="component in $ctrl.setup.components[key]">
                                    <div style="display: flex;align-items: center;">
                                        <span style="padding: 2px 7px;font-size: 13px;background: #242529;border-radius: 3px;">{{name}}</span>
                                        <span style="margin-left: 5px;font-size: 20px;font-weight: 500;">{{component.trigger || component.name}}</span>
                                        <span ng-show="$ctrl.currentIds[component.id]" style="color:red;margin-left: 4px;"><i class="far fa-exclamation-triangle" uib-tooltip="This {{name}} already exists for you. If you import this Setup, the {{name}} will be replaced by the version in this setup."></i></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style="display:flex; justify-content: center;">
                            <button type="button" class="btn btn-primary" ng-click="$ctrl.importSetup()">Import Setup</button>
                        </div>               
                    </div> 
                </div>
                <div class="modal-footer"></div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function($q, logger, ngToast, commandsService, countersService, currencyService,
                effectQueuesService, eventsService, hotkeyService, presetEffectListsService,
                timerService, viewerRolesService, backendCommunicator) {
                const $ctrl = this;

                $ctrl.setupFilePath = null;
                $ctrl.setupSelected = false;

                $ctrl.currentIds = {};
                [
                    ...commandsService.getCustomCommands().map(i => i.id),
                    ...countersService.counters.map(i => i.id),
                    ...currencyService.getCurrencies().map(i => i.id),
                    ...effectQueuesService.getEffectQueues().map(i => i.id),
                    ...eventsService.getAllEvents().map(i => i.id),
                    ...hotkeyService.getHotkeys().map(i => i.id),
                    ...presetEffectListsService.getPresetEffectLists().map(i => i.id),
                    ...timerService.getTimers().map(i => i.id),
                    ...viewerRolesService.getCustomRoles().map(i => i.id)
                ].forEach(id => {
                    $ctrl.currentIds[id] = true;
                });

                $ctrl.componentTypes = {
                    commands: "Command",
                    counters: "Counter",
                    currencies: "Currency",
                    effectQueues: "Effect Queue",
                    events: "Event",
                    hotkeys: "Hotkey",
                    presetEffectLists: "Preset Effect List",
                    timers: "Timer",
                    viewerRoles: "Viewer Role"
                };

                $ctrl.setup = null;

                $ctrl.resetSelectedFile = (message) => {
                    if (message) {
                        ngToast.create(message);
                    }
                    $ctrl.setupSelected = false;
                    $ctrl.setup = null;
                    $ctrl.setupFilePath = null;
                };

                $ctrl.onFileSelected = (filepath) => {
                    console.log(filepath);
                    $q.when(fs.readJson(filepath))
                        .then(setup => {
                            if (setup == null || setup.components == null) {
                                $ctrl.resetSelectedFile("Unable to load setup file: file is invalid");
                                return;
                            }
                            console.log(setup);
                            $ctrl.setup = setup;
                            $ctrl.setupSelected = true;
                        }, (reason) => {
                            logger.error("Failed to load setup file", reason);
                            $ctrl.resetSelectedFile("Failed to load setup file: file is invalid");
                            return;
                        });
                };

                $ctrl.importSetup = () => {
                    $.when(
                        backendCommunicator.fireEventAsync("import-setup", $ctrl.setup)
                    )
                        .then(successful => {
                            if (successful) {
                                ngToast.create({
                                    className: 'success',
                                    content: `Successfully imported Setup: ${$ctrl.setup.name}`
                                });
                                $ctrl.dismiss();
                            } else {
                                ngToast.create(`Failed to import Setup: ${$ctrl.setup.name}`);
                            }

                        });
                };

                $ctrl.$onInit = () => {

                };
            }
        });
}());
