import { EffectType } from "../../../../../types/effects";
import { OBSSceneItem, OBSTransformEaseMode, transformSourceScale } from "../obs-remote";

export const TransformSourceScaleEffectType: EffectType<{
    sceneName?: string;
    sceneItem?: OBSSceneItem;
    sceneItemName?: string;
    isAnimated: boolean;
    text: string;
    file: string;
}> = {
    definition: {
        id: "firebot:obs-transform-source-scale",
        name: "Transform OBS Source Scale",
        description: "Transforms the scale of an OBS source either instantly or animated over time",
        icon: "fad fa-font-case",
        categories: ["common"]
    },
    optionsTemplate: `
        <eos-container header="OBS Scene" pad-top="true">
            <p>sceneName: {{ effect.sceneName }}, sourceName: {{ effect.sourceName }}, sceneItem: {{ effect.sceneItem }}</p>
            <div>
                <button class="btn btn-link" ng-click="getScenes()">Refresh Scene Data</button>
            </div>
            <ui-select ng-if="scenes != null" ng-model="effect.sceneName" on-select="selectScene($select.selected.name)">
                <ui-select-match placeholder="Select a Scene...">{{$select.selected.name}}</ui-select-match>
                <ui-select-choices repeat="scene.name as scene in scenes | filter: {name: $select.search}">
                    <div ng-bind-html="scene.name | highlight: $select.search"></div>
                </ui-select-choices>
                <ui-select-no-choice>
                    <b>No Scenes found.</b>
                </ui-select-no-choice>
            </ui-select>
        </eos-container>
        <eos-container ng-if="sceneItems != null && effect.sceneName != null" header="OBS Source" pad-top="true">
            <div>
                <button class="btn btn-link" ng-click="getSources(effect.sceneName)">Refresh Source Data</button>
                <button class="btn btn-link" ng-click="clearSelection()">Clear Selection</button>
            </div>
            <ui-select ng-if="sceneItems != null" ng-model="effect.sceneItem.name" on-select="selectSceneItem($select.selected)">
                <ui-select-match placeholder="Select a Source...">{{$select.selected.name}}</ui-select-match>
                <ui-select-choices repeat="sceneItem.name as sceneItem in sceneItems | filter: {name: $select.search}">
                    <div ng-bind-html="sceneItem.name | highlight: $select.search"></div>
                </ui-select-choices>
                <ui-select-no-choice>
                    <b>No transformable sources found.</b>
                </ui-select-no-choice>
            </ui-select>
            <div ng-if="sceneItems == null" class="muted">
                No transformable sources found. {{ isObsConfigured ? "Is OBS running?" : "Have you configured the OBS integration?" }}
            </div>
        </eos-container>
        <eos-container ng-if="effect.sceneItem != null" header="Transform" pad-top="true">
            <label class="control-fb control--checkbox">Animate </tooltip>
                <input type="checkbox" ng-model="effect.isAnimated" >
                <div class="control__indicator"></div>
            </label>
        </eos-container>
    `,
    optionsController: ($scope: any, backendCommunicator: any, $q: any) => {
        $scope.isObsConfigured = false;

        $scope.scenes = [];
        $scope.sceneItems = [];

        $scope.selectScene = (sceneName: string) => {
            $scope.effect.sceneItem = undefined;
            $scope.effect.sceneItemName = undefined;
            $scope.getSources(sceneName);
        };

        $scope.selectSceneItem = (sceneItem: OBSSceneItem) => {
            $scope.effect.sceneItem = sceneItem;
            $scope.effect.sceneItemName = sceneItem.name;
        };

        $scope.getScenes = () => {
            $scope.isObsConfigured = backendCommunicator.fireEventSync("obs-is-configured");

            $q.when(backendCommunicator.fireEventAsync("obs-get-scene-list")).then(
                (scenes: string[] | undefined) => {
                    $scope.scenes = scenes?.map(scene => ({ name: scene, custom: false })) ?? [];
                    $scope.scenes.push($scope.customScene);

                    if ($scope.effect.sceneName != null) {
                        $scope.getSources($scope.effect.sceneName);
                    }
                }
            );
        };
        $scope.getScenes();

        $scope.getSources = (sceneName: string) => {
            $scope.isObsConfigured = backendCommunicator.fireEventSync("obs-is-configured");

            $q.when(
                backendCommunicator.fireEventAsync("obs-get-transformable-scene-items", [sceneName])
            ).then((sceneItems: OBSSceneItem[]) => {
                $scope.sceneItems = sceneItems ?? [];
            });
        };

        $scope.clearSelection = function() {
            $scope.effect.sceneName = undefined;
            $scope.effect.sceneItemName = undefined;
        };
    },
    optionsValidator: (effect) => {
        if (effect.sceneName == null) {
            return ["Please select a scene."];
        }
        if (effect.sceneItem == null) {
            return ["Please select a source."];
        }
        return [];
    },
    onTriggerEvent: async ({ effect }) => {
        await transformSourceScale(effect.sceneName, Number(effect.sceneItem.id), 1000, 1000, 500, OBSTransformEaseMode.EaseIn);

        return true;
    }
};
