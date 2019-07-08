"use strict";

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectDependency, EffectTrigger } = effectModels;

const mixplay = require("../../interactive/mixplay");

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
        <eos-container header="Scene Action">
            <dropdown-select options="sceneActions" selected="effect.sceneAction"></dropdown-select>
        </eos-container>

        <eos-container ng-show="effect.sceneAction === 'single'">
            <div style="padding: 10px 10px 0 0;">
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

        <eos-container ng-show="effect.sceneAction === 'scene'" pad-top="true">
            <div class="muted" style="margin-bottom: 5px;">From Scene</div>
            <dropdown-select options="scenes" selected="effect.currentSceneId" ng-show="hasScenes"></dropdown-select>
            <div class="muted" ng-hide="hasScenes">There are no scenes available in the current mixplay project!</div>
        </eos-container>

        <eos-container header="New Scene" pad-top="true">
            <dropdown-select options="scenes" selected="effect.newSceneId" ng-show="hasScenes"></dropdown-select>
            <div class="muted" ng-hide="hasScenes">There are no scenes available in the current mixplay project!</div>
        </eos-container>
    `,
    /**
   * The controller for the front end Options
   */
    optionsController: ($scope, mixplayService) => {
        let currentProject = mixplayService.getCurrentProject();

        $scope.scenes = {};

        $scope.sceneActions = {
            single: 'Move single viewer',
            scene: 'Move all in scene'
        };

        $scope.hasScenes = false;

        if (!$scope.effect.sceneAction) {
            $scope.effect.sceneAction = "single";
        }

        if (!$scope.effect.viewerType) {
            $scope.effect.viewerType = "current";
        }

        function getScenes() {
            if (currentProject) {

                $scope.hasScenes = currentProject.scenes && currentProject.scenes.length > 0;

                for (let scene of currentProject.scenes) {
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
        }

        getScenes();
    },
    /**
   * When the effect is saved
   */
    optionsValidator: effect => {
        let errors = [];
        if (effect.viewerType === 'custom') {
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
        return new Promise((resolve, reject) => {
            let effect = event.effect;

            if (effect.sceneAction === 'single') {
                let username = "";
                if (effect.viewerType === "current") {
                    username = event.trigger.metadata.username;
                } else {
                    username = effect.customViewer ? effect.customViewer.trim() : "";
                }

                mixplay.moveViewerToScene(username, effect.newSceneId);

            } else {
                mixplay.moveViewersToNewScene(effect.currentSceneId, effect.newSceneId);
            }
            resolve();
        });
    }
};

module.exports = delay;
