"use strict";

(function() {
    const fsp = require("fs/promises");

    const { marked } = require("marked");
    const { sanitize } = require("dompurify");

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
                        <div class="effect-list" style="padding: 15px;border-radius: 5px;">
                            <div class="script-name" style="font-size: 30px;font-weight: 100;">{{$ctrl.setup.name || "Unnamed Setup"}} <span class="script-version muted">v{{$ctrl.setup.version}}</span></div>
                            <div style="font-size: 13px;">by <span class="script-author">{{$ctrl.setup.author}}</span></div>
                            <div class="script-description" ng-bind-html="$ctrl.setup.description"></div>
                            <button ng-show="$ctrl.allowCancel" class="btn-sm btn-default" ng-click="$ctrl.resetSelectedFile()" style="margin-top: 3px;">Cancel</button>
                            <button class="btn-sm btn-default pull-right" ng-click="$ctrl.popoutDescription()" style="margin-top: 3px;">Popout Description</button>
                        </div>
                        <div style="margin-top: 25px;">
                            <h4 class="muted">This Setup Adds:</h4>
                            <div ng-repeat="(key, name) in $ctrl.componentTypes">
                                <div ng-repeat="component in $ctrl.setup.components[key]">
                                    <div style="display: flex;align-items: center;">
                                        <span class="list-group-item" style="padding: 2px 7px;font-size: 13px;border-radius: 3px;">{{name}}</span>
                                        <span style="margin-left: 5px;font-size: 20px;font-weight: 500;">{{component.trigger || component.name}}</span>
                                        <span ng-show="$ctrl.currentIds[component.id]" style="color:red;margin-left: 4px;"><i class="far fa-exclamation-triangle" uib-tooltip="This {{name}} already exists for you. If you import this Setup, the {{name}} will be replaced by the version in this setup."></i></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div ng-show="$ctrl.setup.requireCurrency" style="margin-top: 25px;">
                            <h4 class="muted">Currency To Use:</h4>
                            <h5>This setup requires that you select one of your currencies so it can be used in the included effects, variables, and restrictions.</h5>
                            <select
                                class="form-control fb-select"
                                ng-model="$ctrl.selectedCurrency"
                                ng-options="currency as currency.name for currency in $ctrl.currencies">
                                <option value="" disabled selected>Select currency...</option>
                            </select>
                        </div>

                        <div ng-if="$ctrl.setup.importQuestions && $ctrl.setup.importQuestions.length > 0" style="margin-top:25px">
                            <h4 class="muted">Import Questions</h4>
                            <div ng-repeat="question in $ctrl.setup.importQuestions track by question.id">
                                <h5>{{question.question}} <tooltip ng-show="question.helpText" text="question.helpText" /></h5>
                                <input type="{{question.answerType || 'text'}}" class="form-control" ng-model="question.answer" placeholder="Enter answer" />
                            </div>
                        </div>

                        <div style="display:flex; justify-content: center;margin-top: 25px;">
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
                timerService, scheduledTaskService, viewerRolesService, quickActionsService, variableMacroService, viewerRanksService, backendCommunicator, $sce) {
                const $ctrl = this;

                $ctrl.setupFilePath = null;
                $ctrl.setupSelected = false;
                $ctrl.allowCancel = true;

                $ctrl.currencies = currencyService.getCurrencies();
                $ctrl.selectedCurrency = null;

                $ctrl.currentIds = {};
                [
                    ...commandsService.getCustomCommands().map(i => i.id),
                    ...countersService.counters.map(i => i.id),
                    ...currencyService.getCurrencies().map(i => i.id),
                    ...effectQueuesService.getEffectQueues().map(i => i.id),
                    ...eventsService.getAllEvents().map(i => i.id),
                    ...eventsService.getAllEventGroups().map(i => i.id),
                    ...hotkeyService.getHotkeys().map(i => i.id),
                    ...presetEffectListsService.getPresetEffectLists().map(i => i.id),
                    ...timerService.getTimers().map(i => i.id),
                    ...scheduledTaskService.getScheduledTasks().map(i => i.id),
                    ...variableMacroService.macros.map(i => i.id),
                    ...viewerRolesService.getCustomRoles().map(i => i.id),
                    ...viewerRanksService.rankLadders.map(i => i.id),
                    ...quickActionsService.quickActions
                        .filter(qa => qa.type === "custom")
                        .map(i => i.id)
                ].forEach((id) => {
                    $ctrl.currentIds[id] = true;
                });

                $ctrl.componentTypes = {
                    commands: "Command",
                    counters: "Counter",
                    currencies: "Currency",
                    effectQueues: "Effect Queue",
                    events: "Event",
                    eventGroups: "Event Sets",
                    hotkeys: "Hotkey",
                    presetEffectLists: "Preset Effect List",
                    timers: "Timer",
                    scheduledTasks: "Scheduled Effect List",
                    variableMacros: "Variable Macro",
                    viewerRoles: "Viewer Role",
                    viewerRankLadders: "Viewer Rank Ladder",
                    quickActions: "Quick Action"
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

                $ctrl.popoutDescription = () => {
                    const modal = window.open('', 'modal');

                    modal.document.write(`
                        <div style="font-size: 30px;font-weight: 100;">Firebot Setup - ${$ctrl.setup.name}</div>
                        <div>${$ctrl.setup.description}</div>
                    `);

                    modal.document.title = `Firebot Setup - ${$ctrl.setup.name}`;
                    modal.document.body.style.fontFamily = "sans-serif";
                };

                $ctrl.onFileSelected = (filepath) => {
                    $q.when(fsp.readFile(filepath))
                        .then((setup) => {
                            setup = JSON.parse(setup);
                            if (setup == null || setup.components == null) {
                                $ctrl.resetSelectedFile("Unable to load setup file: file is invalid");
                                return;
                            }
                            $ctrl.setup = setup;
                            // parse markdown
                            $ctrl.setup.description = $sce.trustAsHtml(
                                sanitize(marked($ctrl.setup.description, {}))
                            );
                            //set default answers
                            if ($ctrl.setup.importQuestions) {
                                $ctrl.setup.importQuestions = $ctrl.setup.importQuestions.map((q) => {
                                    if (q.defaultAnswer) {
                                        q.answer = q.defaultAnswer;
                                    }
                                    return q;
                                });
                            }
                            $ctrl.setupSelected = true;
                        }, (reason) => {
                            logger.error("Failed to load setup file", reason);
                            $ctrl.allowCancel = true;
                            $ctrl.resetSelectedFile("Failed to load setup file: file is invalid");
                            return;
                        });
                };

                $ctrl.importSetup = () => {

                    if ($ctrl.setup.requireCurrency && $ctrl.selectedCurrency == null) {
                        ngToast.create("Please select a currency to use. If you don't have a currency, create one in the Currency tab and then import this Setup again.");
                        return;
                    }

                    if ($ctrl.setup.importQuestions &&
                        $ctrl.setup.importQuestions.some(q => q.answer == null)) {
                        ngToast.create("Please provide an answer for all Import Questions.");
                        return;
                    }

                    $q.when(
                        backendCommunicator.fireEventAsync("import-setup", {
                            setup: $ctrl.setup,
                            selectedCurrency: $ctrl.selectedCurrency
                        })
                    )
                        .then((successful) => {
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
                    if ($ctrl.resolve.setupFilePath) {
                        $ctrl.allowCancel = false;
                        $ctrl.setupFilePath = $ctrl.resolve.setupFilePath;
                        $ctrl.onFileSelected($ctrl.setupFilePath);
                    }
                };
            }
        });
})();
