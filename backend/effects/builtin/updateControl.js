"use strict";

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectDependency, EffectTrigger } = effectModels;
const logger = require("../../logwrapper");

const mixplay = require("../../interactive/mixplay");
const mixplayManager = require("../../interactive/mixplay-project-manager");


let hiddenControls = {};

const model = {
    definition: {
        id: "firebot:updatecontrol",
        name: "Update Control",
        description: "Change various properties of a MixPlay Control.",
        tags: ["Built in"],
        dependencies: [EffectDependency.INTERACTIVE],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    optionsTemplate: `
        <eos-container header="MixPlay Project">
            <dropdown-select ng-show="hasProjects" uib-tooltip="{{getTooltip()}}" tooltip-append-to-body="true" options="projects" selected="effect.mixplayProject" on-update="projectChanged()" is-disabled="disableProjectDropdown"></dropdown-select>
            <span ng-hide="hasProjects" class="muted">You currently don't have any MixPlay projects created. Create on in the Controls tab!</span>
            <div class="effect-info alert alert-info" ng-hide="disableProjectDropdown" style="margin-bottom:0;">
                Remember the selected mixplay project must be connected when this effect is triggered for it to work.
            </div>
        </eos-container>
        
        <eos-container header="Control To Update" pad-top="true" ng-show="effect.mixplayProject != null">
            <ui-select ng-model="effect.control.id" theme="bootstrap" on-select="controlSelect($item)">
                <ui-select-match placeholder="Select or search for a control... ">{{$select.selected.controlName}}</ui-select-match>
                <ui-select-choices repeat="controlData.control.id as controlData in availableControlData | filter: $select.search " style="position:relative;">
                    <div>{{controlData.controlName}}</div>
                    <small class="muted">Type: {{controlData.control.kind}} | Scene: {{controlData.sceneName}}</small>
                </ui-select-choices>
            </ui-select>
        </eos-container>

        <eos-container header="Properties" pad-top="true" ng-show="effect.mixplayProject != null && effect.control.id != null">
        
            <div style="padding-left: 10px;">
                <label class="control-fb control--radio" >Reset to default<span class="muted"><br />Reset properties to the default values saved for the control</span>
                    <input type="radio" ng-model="effect.propertyAction" value="reset"/>
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio">Customize<span class="muted"><br />Customize control properties individually</span>
                    <input type="radio" ng-model="effect.propertyAction" value="customize"/>
                    <div class="control__indicator"></div>
                </label>          
            </div>

            <div class="general-button-settings" ng-show="effect.propertyAction === 'customize'">

                <live-control-preview control="controlPreviewData"></live-control-preview>

                <div class="settings-title" style="margin-top: 15px;">
                    <h3>MixPlay Settings</h3>
                </div>
                <control-settings control="effect.control" kind="controlKind" update-mode="true" trigger="{{trigger}}" trigger-meta="triggerMeta"></control-settings>

                <div style="margin-top:5px;">
                    <label class="control-fb control--checkbox"> Edit Active Status
                        <input type="checkbox" ng-init="editActive = (effect.activeStatus != null && effect.activeStatus !== '')" ng-model="editActive"  ng-click="effect.activeStatus = undefined">
                        <div class="control__indicator"></div>
                    </label>
                    <div uib-collapse="!editActive" style="margin: 0 0 15px 15px;">
                        <div class="btn-group" uib-dropdown>
                            <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
                            {{ effect.activeStatus === "toggle" ? "Toggle" : effect.activeStatus ? "Active" : "Disabled" }} <span class="caret"></span>
                            </button>
                            <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                                <li role="menuitem" ng-click="effect.activeStatus = true"><a href>Active</a></li>
                                <li role="menuitem" ng-click="effect.activeStatus = false"><a href>Disabled</a></li>
                                <li role="menuitem" ng-click="effect.activeStatus = 'toggle'"><a href>Toggle</a></li>
                            </ul>
                        </div>
                    </div>         
                </div>
                
                <div style="margin-top:5px;" ng-show="hasPositions">
                    <label class="control-fb control--checkbox"> Edit Visibility <tooltip text="'This is just adding/removing the control from all grids.'"></tooltip>
                        <input type="checkbox" ng-init="editVisibility = (effect.visible != null && effect.visible !== '')" ng-model="editVisibility"  ng-click="effect.visible = undefined">
                        <div class="control__indicator"></div>
                    </label>
                    <div uib-collapse="!editVisibility" style="margin: 0 0 15px 15px;">
                        <div class="btn-group" uib-dropdown>
                            <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
                            {{ effect.visible === "toggle" ? "Toggle" : effect.visible ? "Visible" : "Hidden" }} <span class="caret"></span>
                            </button>
                            <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                                <li role="menuitem" ng-click="effect.visible = true"><a href>Visible</a></li>
                                <li role="menuitem" ng-click="effect.visible = false"><a href>Hidden</a></li>
                                <li role="menuitem" ng-click="effect.visible = 'toggle'"><a href>Toggle</a></li>
                            </ul>
                        </div>
                    </div>         
                </div> 


            </div>
        </eos-container>
    `,
    optionsController: ($scope, mixplayService) => {

        if (!$scope.effect.control) {
            $scope.effect.control = {};
        }

        $scope.availableControlData = [];

        $scope.hasProjects = false;
        $scope.projects = {};

        let projects = mixplayService.getProjects();
        if (projects && projects.length > 0) {
            $scope.hasProjects = true;
            for (let project of projects) {
                $scope.projects[project.id] = project.name;
            }
        }
        if ($scope.effect.mixplayProject) {
            if (!$scope.projects[$scope.effect.mixplayProject]) {
                $scope.effect.mixplayProject = null;
            }
        }

        // force to current project if we are in the context of interactive
        if ($scope.trigger === "interactive") {
            if ($scope.hasProjects) {
                let projectId = mixplayService.getCurrentProjectId();
                if (projectId) {
                    $scope.effect.mixplayProject = mixplayService.getCurrentProjectId();
                    $scope.disableProjectDropdown = true;
                }
            }
        }

        $scope.getTooltip = function() {
            return $scope.disableProjectDropdown ? "You can only update controls for current project when adding this effect to a control." : "";
        };

        function loadControls() {
            $scope.availableControlData = JSON.parse(
                JSON.stringify(mixplayService.getControlDataForProject($scope.effect.mixplayProject))
            );
        }

        if ($scope.effect.mixplayProject) {
            loadControls();
        }


        $scope.projectChanged = function() {
            loadControls();
        };

        let baseControlData = null;
        $scope.controlKind = "button";
        function loadControlSize() {
            if (!$scope.effect.control.id) return;

            let controlData = $scope.availableControlData.find(cd => cd.control.id === $scope.effect.control.id);

            if (!controlData) return;

            baseControlData = controlData.control;

            $scope.hasPositions = baseControlData.position && baseControlData.position.length > 0;

            if (!$scope.hasPositions) {
                $scope.effect.visible = undefined;
            }

            let kind = controlData.controlKind;
            if (kind) {
                $scope.controlKind = kind;
            }
        }
        loadControlSize();


        $scope.controlPreviewData = null;
        function updateControlPreviewData() {
            if (!baseControlData) return;

            let controlMixPlayOverrides = $scope.effect.control.mixplay;
            let filteredOverrides = {};
            for (let key of Object.keys(controlMixPlayOverrides)) {
                let value = controlMixPlayOverrides[key];
                if (value === null || value === undefined || value === "") continue;
                filteredOverrides[key] = value;
            }

            $scope.controlPreviewData = Object.assign({}, baseControlData);

            $scope.controlPreviewData.mixplay = Object.assign({},
                baseControlData.mixplay, filteredOverrides);

            $scope.effect.control.mixplay = filteredOverrides;
        }

        $scope.controlSelect = function(item) {
            baseControlData = item.control;
            $scope.effect.control = {
                id: item.control.id,
                mixplay: {}
            };
            loadControlSize();
            updateControlPreviewData();
        };

        $scope.$watch('effect["control"]["mixplay"]', function () {
            loadControlSize();
            updateControlPreviewData();
        }, true);
    },
    optionsValidator: effect => {
        let errors = [];
        if (effect.mixplayProject == null) {
            errors.push("Please select a MixPlay project.");
        }
        if (effect.control == null || effect.control.id == null) {
            errors.push("Please select a control.");
        }
        if (effect.propertyAction == null) {
            errors.push("Please select whether to customize or reset properties.");
        }
        return errors;
    },
    /**
     * When the effect is triggered by something
     */
    onTriggerEvent: event => {
        return new Promise(async (resolve) => {

            let effect = event.effect;

            if (effect.mixplayProject == null) {
                return resolve(true);
            }

            let connectedProject = mixplayManager.getConnectedProject();
            if (!connectedProject || connectedProject.id !== effect.mixplayProject) return resolve(true);
            if (!effect.control || !effect.control.id) return resolve(true);

            let defaultControl = mixplayManager.getControlInProject(connectedProject.id, effect.control.id);

            let mixplayControl = mixplay.client.state.getControl(effect.control.id);
            if (!mixplayControl) return resolve(true);

            if (effect.propertyAction) {
                let mappedControl = null;
                if (effect.propertyAction === "customize") {
                    let control = effect.control;
                    control.kind = defaultControl.kind;
                    if (effect.activeStatus != null) {
                        if (effect.activeStatus === "toggle") {
                            control.active = !(mixplayControl.disabled === false);
                        } else {
                            control.active = effect.activeStatus;
                        }
                    }

                    if (effect.visible != null) {
                        let shouldBeVisible = true;
                        if (effect.visible === "toggle") {
                            let hiddenControls = mixplay.getHiddenControls();
                            let currentlyVisible = mixplayControl.position && mixplayControl.position.length > 0 && !hiddenControls[effect.control.id];
                            shouldBeVisible = !currentlyVisible;
                        } else {
                            shouldBeVisible = effect.visible === true;
                        }
                        if (shouldBeVisible) {
                            control.position = defaultControl.position;
                        } else {
                            control.position = [];
                        }
                        mixplay.markControlAsHidden(effect.control.id, !shouldBeVisible);
                    }

                    if (control.mixplay.cost && control.mixplay.cost > 0) {
                        control.mixplay.cost = Math.round(control.mixplay.cost);
                    }

                    mappedControl = mixplay.mapMixplayControl(control);

                } else {
                    mappedControl = mixplay.mapMixplayControl(defaultControl);
                }

                if (mappedControl) {
                    mixplayControl.update(mappedControl)
                        .then(() => {
                            resolve(true);
                        }, () => {
                            resolve(true);
                        });
                } else {
                    resolve(true);
                }
            } else {
                resolve(true);
            }
        });
    }
};

module.exports = model;
