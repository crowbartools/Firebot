"use strict";

(function() {
    const sanitizeFileName = require("sanitize-filename");
    const fs = require("fs");
    const fsp = require("fs/promises");
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

                    <h3>Options</h3>
                    <div>
                        <label class="control-fb control--checkbox" style="margin-bottom: 0px; font-size: 13px;opacity.0.9;"> Require User To Select A Currency <tooltip text="'Require the user to select one of THEIR currencies before importing. Firebot will update all Currency Effects, Variables, and Restrictions in the included components to use the selected currency. This is great for Chat games.'"></tooltip>
                            <input type="checkbox" ng-model="$ctrl.setup.requireCurrency">
                            <div class="control__indicator"></div>
                        </label>
                    </div>

                    <h3>Import Questions <tooltip text="'Users must supply answers to these questions before importing this Setup. Firebot will automatically replace all instances of the given token with the user\\'s answer.'"/></h3>
                    <div>
                        <div>
                            <div ng-repeat="question in $ctrl.setup.importQuestions track by question.id" class="list-item selectable" ng-click="$ctrl.addImportQuestion(question)">
                                <div uib-tooltip="Click to edit" style="font-weight: 400;">
                                    <div><b>Question:</b> {{question.question}}</div>
                                    <div><b>Replace Token:</b> {{question.replaceToken}}</div>
                                    <div ng-show="question.defaultAnswer"><b>Default Answer:</b> {{question.defaultAnswer}}</div>
                                </div>
                                <span class="clickable" style="color: #fb7373;" ng-click="$ctrl.removeImportQuestion(question.id);$event.stopPropagation();" aria-label="Remove item">
                                    <i class="fad fa-trash-alt" aria-hidden="true"></i>
                                </span>
                            </div>
                        </div>
                        <button class="filter-bar" ng-click="$ctrl.addImportQuestion()" uib-tooltip="Add Import Question" tooltip-append-to-body="true">
                            <i class="far fa-plus"></i>
                        </button>
                    </div>

                    <div style="margin-top: 20px;">
                        <div class="alert alert-warning" role="alert" style="opacity: 0.8;margin-bottom: 0;"><b>Warning!</b> Media files (such as images, videos, sounds, customs scripts, etc) referenced in effects will <b>not</b> be included with this Setup.</div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default pull-left" ng-click="$ctrl.loadPreviousSetup()">Load Previous</button>
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
                timerService, viewerRolesService, quickActionsService, variableMacroService, viewerRanksService, accountAccess, utilityService,
                ngToast, backendCommunicator, sortTagsService, $q) {

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
                        label: "Event Sets",
                        all: eventsService.getAllEventGroups(),
                        nameField: "name",
                        key: "eventGroups"
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
                        label: "Variable Macros",
                        all: variableMacroService.macros,
                        nameField: "name",
                        key: "variableMacros"
                    },
                    {
                        label: "Viewer Roles",
                        all: viewerRolesService.getCustomRoles(),
                        nameField: "name",
                        key: "viewerRoles"
                    },
                    {
                        label: "Viewer Rank Ladders",
                        all: viewerRanksService.rankLadders,
                        nameField: "name",
                        key: "viewerRankLadders"
                    },
                    {
                        label: "Quick Actions",
                        all: quickActionsService.quickActions.filter(qa => qa.type === "custom"),
                        nameField: "name",
                        key: "quickActions"
                    }
                ];

                $ctrl.addOrEditComponent = (componentConfig) => {
                    const components = componentConfig.all.map((c) => {
                        return {
                            id: c.id,
                            name: c[componentConfig.nameField],
                            tags: sortTagsService.getSortTagsForItem(componentConfig.key, c.sortTags).map(st => st.name)
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
                        eventGroups: [],
                        hotkeys: [],
                        presetEffectLists: [],
                        timers: [],
                        variableMacros: [],
                        viewerRoles: [],
                        viewerRankLadders: [],
                        quickActions: []
                    },
                    requireCurrency: false,
                    importQuestions: []
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

                    if (Object.values($ctrl.setup.components)
                        .every(array => array == null || array.length < 1)) {
                        ngToast.create("Please select at least one component");
                        return;
                    }

                    /**@type {Electron.SaveDialogOptions} */
                    const saveDialogOptions = {
                        buttonLabel: "Save Setup",
                        defaultPath: `${sanitizeFileName($ctrl.setup.name)}.firebotsetup`,
                        title: "Save Setup File",
                        filters: [
                            {name: "Firebot Setup Files", extensions: ['firebotsetup']}
                        ],
                        properties: ["showOverwriteConfirmation", "createDirectory"]
                    };

                    $q.when(backendCommunicator.fireEventAsync("show-save-dialog", {
                        options: saveDialogOptions
                    }))
                        .then((saveResponse) => {
                            if (saveResponse.canceled) {
                                return;
                            }
                            fs.writeFileSync(saveResponse.filePath, angular.toJson($ctrl.setup), { encoding: "utf8" });
                            ngToast.create({
                                className: 'success',
                                content: 'Saved Firebot Setup.'
                            });
                            $ctrl.close();
                        });
                };

                $ctrl.$onInit = () => {};

                $ctrl.onFileSelected = (filepath) => {
                    $q.when(fsp.readFile(filepath))
                        .then((setup) => {
                            setup = JSON.parse(setup);
                            if (setup == null || setup.components == null) {
                                ngToast.create("Unable to load previous Setup!");
                                return;
                            }
                            for (const [componentKey, componentList] of Object.entries(setup.components)) {
                                const componentConfig = $ctrl.components.find(c => c.key === componentKey);
                                if (!componentConfig) {
                                    continue;
                                }

                                setup.components[componentConfig.key] = componentConfig.all
                                    .filter(c => componentList.some(cy => cy.id === c.id));
                            }
                            $ctrl.setup = setup;
                        }, (reason) => {
                            console.log(reason);
                            ngToast.create("Unable to load previous Setup!");
                            return;
                        });
                };

                $ctrl.loadPreviousSetup = () => {
                    $q
                        .when(backendCommunicator.fireEventAsync("open-file-browser", {
                            options: {
                                filters: [{name: 'Firebot Setups', extensions: ['firebotsetup']}]
                            }
                        }))
                        .then((response) => {
                            if (response.path == null) {
                                return;
                            }

                            $ctrl.onFileSelected(response.path);
                        });
                };

                $ctrl.removeImportQuestion = (id) => {
                    $ctrl.setup.importQuestions = $ctrl.setup.importQuestions
                        .filter(q => q.id !== id);
                };

                $ctrl.addImportQuestion = (question) => {
                    utilityService.showModal({
                        component: "addOrEditSetupQuestion",
                        size: 'md',
                        resolveObj: {
                            question: () => question
                        },
                        closeCallback: (question) => {
                            if ($ctrl.setup.importQuestions == null) {
                                $ctrl.setup.importQuestions = [];
                            }
                            if (question) {
                                const index = $ctrl.setup.importQuestions
                                    .findIndex(q => q.id === question.id);
                                if (index > -1) {
                                    $ctrl.setup.importQuestions[index] = question;
                                } else {
                                    $ctrl.setup.importQuestions.push(question);
                                }
                            }
                        }
                    });
                };

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
})();
