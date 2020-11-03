"use strict";

(function() {
    const sanitizeFileName = require("sanitize-filename");
    const fs = require("fs-extra");
    angular.module("firebotApp")
        .component("createSetupModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Create New Setup</h4>
                </div>
                <div class="modal-body">
                    <h3>Name</h3>
                    <input type="text" class="form-control" ng-model="$ctrl.setup.name" placeholder="Enter name">

                    <h3>Description</h3>
                    <textarea type="text" class="form-control" rows="3" ng-model="$ctrl.setup.description" placeholder="Enter description (supports Markdown)"></textarea>

                    <h3>Version</h3>
                    <input type="number" class="form-control" ng-model="$ctrl.setup.version" placeholder="Enter version">

                    <h3>Components</h3>   
                    <p class="muted">Select the various components that you want to include in this Firebot Setup.</p>
                    <div ng-repeat="componentConfig in $ctrl.components track by $index" style="margin-bottom: 20px;">
                        <h4>{{componentConfig.label}}</h4>
                        <div style="padding-left: 5px">
                            <div
                                style="margin-bottom: 13px;" 
                                ng-repeat="component in $ctrl.setup.components[componentConfig.key] track by component.id">
                                <span style="font-weight: 800; font-size: 15px; padding: 5px; background: #494d54; border-radius: 10px;">
                                    {{component[componentConfig.nameField]}}
                                </span>         
                            </div>
                        </div>
                        <button class="btn btn-link" ng-click="$ctrl.addOrEditComponent(componentConfig)">
                            <i class="fal" ng-class="!!$ctrl.setup.components[componentConfig.key].length ? 'fa-edit' : 'fa-plus'"></i> {{!!$ctrl.setup.components[componentConfig.key].length ? 'Edit' : 'Add'}}
                        </button>
                    </div>

                    <div>
                        <div class="alert alert-warning" role="alert" style="opacity: 0.8;margin-bottom: 0;"><b>Warning!</b> Media files (such as images, videos, sounds, customs scripts, etc) referenced in effects will <b>not</b> be included with this Setup.</div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                    <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Create Setup</button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(commandsService, countersService, currencyService,
                effectQueuesService, eventsService, hotkeyService, presetEffectListsService,
                timerService, viewerRolesService, accountAccess, utilityService,
                ngToast, backendCommunicator, $q) {

                const $ctrl = this;

                $ctrl.components = [
                    {
                        label: "Commands",
                        all: commandsService.getCustomCommands(),
                        nameField: "trigger",
                        key: "commands"
                    },
                    {
                        label: "Counters",
                        all: countersService.counters,
                        nameField: "name",
                        key: "counters"
                    },
                    {
                        label: "Currencies",
                        all: currencyService.getCurrencies(),
                        nameField: "name",
                        key: "currencies"
                    },
                    {
                        label: "Effect Queues",
                        all: effectQueuesService.getEffectQueues(),
                        nameField: "name",
                        key: "effectQueues"
                    },
                    {
                        label: "Events",
                        all: eventsService.getAllEvents(),
                        nameField: "name",
                        key: "events"
                    },
                    {
                        label: "Hotkeys",
                        all: hotkeyService.getHotkeys(),
                        nameField: "name",
                        key: "hotkeys"
                    },
                    {
                        label: "Preset Effect Lists",
                        all: presetEffectListsService.getPresetEffectLists(),
                        nameField: "name",
                        key: "presetEffectLists"
                    },
                    {
                        label: "Timers",
                        all: timerService.getTimers(),
                        nameField: "name",
                        key: "timers"
                    },
                    {
                        label: "Viewer Roles",
                        all: viewerRolesService.getCustomRoles(),
                        nameField: "name",
                        key: "viewerRoles"
                    }
                ];

                $ctrl.addOrEditComponent = (componentConfig) => {
                    const components = componentConfig.all.map(c => {
                        return {
                            id: c.id,
                            name: c[componentConfig.nameField]
                        };
                    });
                    const selectedIds = $ctrl.setup.components[componentConfig.key].map(c => c.id);
                    $ctrl.openComponentListModal(componentConfig.label, components, selectedIds, (newSelectedIds) => {
                        $ctrl.setup.components[componentConfig.key] = componentConfig.all.filter(c => newSelectedIds.includes(c.id));
                    });
                };

                $ctrl.setup = {
                    name: "",
                    description: "",
                    version: 1,
                    author: accountAccess.accounts.streamer.loggedIn ?
                        accountAccess.accounts.streamer.username : "Unknown",
                    components: {
                        commands: [],
                        counters: [],
                        currencies: [],
                        effectQueues: [],
                        events: [],
                        hotkeys: [],
                        presetEffectLists: [],
                        timers: [],
                        viewerRoles: []
                    }
                };

                $ctrl.save = () => {
                    if ($ctrl.setup.name == null || $ctrl.setup.name === "") {
                        ngToast.create("Please give this Setup a name.");
                        return;
                    }

                    if ($ctrl.setup.description == null || $ctrl.setup.description === "") {
                        ngToast.create("Please give this Setup a description.");
                        return;
                    }

                    if ($ctrl.setup.version == null || $ctrl.setup.version <= 0) {
                        ngToast.create("The Setup version must be greater than 0");
                        return;
                    }

                    if (Object.values($ctrl.setup.components).every(array => array == null || array.length < 1)) {
                        ngToast.create("Please select at least one component");
                        return;
                    }

                    /**@type {Electron.SaveDialogOptions} */
                    const saveDialogOptions = {
                        buttonLabel: "Save Setup",
                        defaultPath: sanitizeFileName($ctrl.setup.name),
                        title: "Save Setup File",
                        filters: [
                            {name: "Firebot Setup Files", extensions: ['firebotsetup']}
                        ],
                        properties: ["showOverwriteConfirmation", "createDirectory"]
                    };

                    $q.when(backendCommunicator.fireEventAsync("show-save-dialog", {
                        options: saveDialogOptions
                    }))
                        .then(saveResponse => {
                            if (saveResponse.cancelled) {
                                return;
                            }
                            fs.writeFile(saveResponse.filePath, angular.toJson($ctrl.setup), 'utf8');
                            ngToast.create({
                                className: 'success',
                                content: 'Saved Firebot Setup.'
                            });
                            $ctrl.close();
                        });
                };

                $ctrl.$onInit = () => {};

                $ctrl.openComponentListModal = (label, allComponents, selectedIds, closeCallback) => {
                    utilityService.showModal({
                        component: "firebotComponentListModal",
                        size: 'sm',
                        resolveObj: {
                            label: () => label,
                            allComponents: () => allComponents,
                            selectedIds: () => selectedIds
                        },
                        closeCallback: closeCallback
                    });
                };
            }
        });
}());
