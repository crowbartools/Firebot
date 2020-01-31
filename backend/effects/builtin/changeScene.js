"use strict";

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectDependency, EffectTrigger } = effectModels;

const mixplay = require("../../interactive/mixplay");
const mixplayManager = require("../../interactive/mixplay-project-manager");

/**
 * The Delay effect
 */
const delay = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:changescene",
        name: "Change MixPlay Scene",
        description: "Change viewer(s) between scenes",
        tags: ["Built in"],
        dependencies: [EffectDependency.INTERACTIVE],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    /**
   * The HTML template for the Options view (ie options when effect is added to something such as a button.
   * You can alternatively supply a url to a html file via optionTemplateUrl
   */
    optionsTemplate: `

        <eos-container header="MixPlay Project" ng-hide="disableProjectDropdown">
            <dropdown-select ng-show="hasProjects" uib-tooltip="{{getTooltip()}}" tooltip-append-to-body="true" options="projects" selected="effect.mixplayProject" on-update="projectChanged()" is-disabled="disableProjectDropdown"></dropdown-select>
            <span ng-hide="hasProjects" class="muted">You currently don't have any MixPlay projects created. Create on in the Controls tab!</span>
            <div class="effect-info alert alert-info" ng-hide="disableProjectDropdown" style="margin-bottom:0;">
                Remember the selected mixplay project must be connected when this effect is triggered for it to work.
            </div>
        </eos-container>

        <eos-container header="Operation" pad-top="!disableProjectDropdown" ng-show="effect.mixplayProject">
            <dropdown-select options="sceneActions" selected="effect.sceneAction"></dropdown-select>
        </eos-container>

        <eos-container header="Viewer" pad-top="true" ng-show="effect.sceneAction === 'single'">
            <div style="padding: 0 10px 0 0;">
                <label class="control-fb control--radio">Associated viewer <tooltip text="'The viewer who pressed this button/ran the command/etc.'"></tooltip>
                    <input type="radio" ng-model="effect.viewerType" value="current"/> 
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio" style="margin-bottom: 10px;">Custom viewer
                    <input type="radio" ng-model="effect.viewerType" value="custom"/>
                    <div class="control__indicator"></div>
                </label>                
                <div ng-show="effect.viewerType === 'custom'" style="padding-left: 30px;">
                    <input class="form-control" type="text" ng-model="effect.customViewer" placeholder="Username" replace-variables></input> 
                </div>               
            </div>
        </eos-container>

        <eos-container header="From Scene" ng-show="effect.sceneAction === 'scene'" pad-top="true">
            <dropdown-select options="scenes" selected="effect.currentSceneId" ng-show="hasScenes"></dropdown-select>
            <div class="muted" ng-hide="hasScenes">There are no scenes available in the current mixplay project!</div>
        </eos-container>

        <eos-container header="New Scene" pad-top="true" ng-hide="effect.sceneAction == null">
            <dropdown-select options="scenes" selected="effect.newSceneId" ng-show="hasScenes"></dropdown-select>
            <div class="muted" ng-hide="hasScenes">There are no scenes available in the current mixplay project!</div>
        </eos-container>
    `,
    /**
   * The controller for the front end Options
   */
    optionsController: ($scope, mixplayService) => {

        $scope.scenes = {};

        $scope.sceneActions = {
            single: 'Move Single Viewer',
            scene: 'Move Viewers In Scene',
            all: 'Move All Viewers'
        };

        $scope.hasScenes = false;

        function getScenes() {
            let selectedProject = mixplayService.getProjectById($scope.effect.mixplayProject);

            if (!selectedProject) {
                $scope.scenes = {};
                $scope.effect.newSceneId = undefined;
                $scope.effect.currentSceneId = undefined;
                return;
            }

            $scope.hasScenes = selectedProject.scenes && selectedProject.scenes.length > 0;

            for (let scene of selectedProject.scenes) {
                $scope.scenes[scene.id] = scene.name;
            }

            if ($scope.hasScenes) {
                if (!$scope.effect.newSceneId) {
                    $scope.effect.newSceneId = Object.keys($scope.scenes)[0];
                }
                if (!$scope.effect.currentSceneId) {
                    $scope.effect.currentSceneId = Object.keys($scope.scenes)[0];
                }
            }
        }

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
                    $scope.effect.mixplayProject = projectId;
                    $scope.disableProjectDropdown = true;
                    getScenes();
                }
            }
        }

        $scope.getTooltip = function() {
            return $scope.disableProjectDropdown ? "You can only use the current project when adding this effect to a control." : "";
        };

        $scope.projectChanged = function() {
            getScenes();
        };

        if (!$scope.effect.viewerType) {
            $scope.effect.viewerType = "current";
        }

        getScenes();
    },
    /**
   * When the effect is saved
   */
    optionsValidator: effect => {
        let errors = [];
        if (effect.sceneAction == null) {
            errors.push("Please select a scene operation.");
        }
        if (effect.sceneAction === 'single' && effect.viewerType === 'custom') {
            if (effect.customViewer == null || effect.customViewer.trim() === '') {
                errors.push("Please enter a custom viewer name.");
            }
        }
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: event => {
        return new Promise(resolve => {
            let effect = event.effect;

            //mixplayProject

            if (effect.mixplayProject == null) {
                return resolve(true);
            }

            let connectedProject = mixplayManager.getConnectedProject();
            if (!connectedProject || connectedProject.id !== effect.mixplayProject) return resolve(true);

            if (effect.sceneAction === 'single') {
                let username = "";
                if (effect.viewerType === "current") {
                    username = event.trigger.metadata.username;
                } else {
                    username = effect.customViewer ? effect.customViewer.trim() : "";
                }

                mixplay.moveViewerToScene(username, effect.newSceneId);

            } else if (effect.sceneAction === 'scene') {
                mixplay.moveViewersToNewScene(effect.currentSceneId, effect.newSceneId);
            } else {
                //move all viewers
                mixplay.moveAllViewersToScene(effect.newSceneId);
            }
            resolve();
        });
    }
};

module.exports = delay;
