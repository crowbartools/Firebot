import { EffectType } from "../../../../../types/effects";
import { OBSSource, OBSTransformEaseMode, transformSourceScale } from "../obs-remote";

export const TransformSourceScaleEffectType: EffectType<{
    sceneName?: string;
    sourceName?: string;
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
        <div>
            <button class="btn btn-link" ng-click="getScenes()">Refresh Scene Data</button>
        </div>
        <ui-select ng-if="scenes != null" ng-model="selectedScene" on-select="selectScene($select.selected.name)">
            <ui-select-match placeholder="Select an OBS Scene...">{{$select.selected.name}}</ui-select-match>
            <ui-select-choices repeat="scene in scenes | filter: {name: $select.search}">
                <div ng-bind-html="scene.name | highlight: $select.search"></div>
            </ui-select-choices>
            <ui-select-no-choice>
                <b>No Scenes found.</b>
            </ui-select-no-choice>
        </ui-select>
    </eos-container>
    <eos-container ng-if="sources != null && effect.sceneName != null" header="OBS Source" pad-top="true">
        <div>
            <button class="btn btn-link" ng-click="getSources(effect.sceneName)">Refresh Source Data</button>
        </div>
        <ui-select ng-model="selectedSource" on-select="selectSource($select.selected.name)">
            <ui-select-match placeholder="Select a Source...">{{$select.selected.name}}</ui-select-match>
            <ui-select-choices repeat="source in sources | filter: {name: $select.search}">
                <div ng-bind-html="source.name | highlight: $select.search"></div>
            </ui-select-choices>
            <ui-select-no-choice>
                <b>No transformable sources found.</b>
            </ui-select-no-choice>
        </ui-select>
        <div ng-if="sources == null" class="muted">
            No sources found. {{ isObsConfigured ? "Is OBS running?" : "Have you configured the OBS integration?" }}
        </div>
    </eos-container>
    <eos-container ng-if="effect.sourceName != null" header="Transform" style="margin-top: 10px;" pad-top="true">
        <label class="control-fb control--checkbox">Animate </tooltip>
            <input type="checkbox" ng-model="effect.isAnimated" >
            <div class="control__indicator"></div>
        </label>
    </eos-container>
  `,
    optionsController: ($scope: any, backendCommunicator: any, $q: any) => {
        $scope.isObsConfigured = false;

        $scope.scenes = [];
        $scope.sources = [];

        console.log($scope.selectedSource);

        $scope.selectScene = (sceneName: string) => {
            $scope.effect.sceneName = sceneName;
            $scope.effect.sourceName = undefined;
            $scope.selectedSource = null;
            $scope.getSources(sceneName);
        };

        $scope.selectSource = (sourceName: string) => {
            $scope.effect.sourceName = sourceName;
        };

        $scope.getScenes = () => {
            $scope.isObsConfigured = backendCommunicator.fireEventSync("obs-is-configured");

            $q.when(backendCommunicator.fireEventAsync("obs-get-scene-list")).then(
                (scenes: string[]) => {
                    $scope.scenes = [];
                    if (scenes != null) {
                        scenes.forEach((scene) => {
                            $scope.scenes.push({name: scene, custom: false});
                        });
                    }
                    $scope.scenes.push($scope.customScene);
                    if ($scope.effect.custom) {
                        $scope.selectedScene = $scope.customScene;
                    } else {
                        $scope.selectedScene = $scope.scenes.find(scene => scene.name === $scope.effect.sceneName);
                    }

                    if ($scope.selectedScene != null) {
                        $scope.getSources($scope.selectedScene.name);
                    }
                }
            );
        };
        $scope.getScenes();

        $scope.getSources = (sceneName: string) => {
            $scope.isObsConfigured = backendCommunicator.fireEventSync("obs-is-configured");

            $q.when(
                backendCommunicator.fireEventAsync("obs-get-transformable-sources", [sceneName])
            ).then((sources: OBSSource[]) => {
                $scope.sources = sources;
                if ($scope.effect.sourceName != null) {
                    $scope.selectedSource = $scope.sources?.find(source => source.name === $scope.effect.sourceName);
                    console.log($scope.selectedSource);
                }
            });
        };
    },
    optionsValidator: (effect) => {
        if (effect.sceneName == null) {
            return ["Please select a scene."];
        }
        if (effect.sourceName == null) {
            return ["Please select a source."];
        }
        return [];
    },
    onTriggerEvent: async ({ effect }) => {
        await transformSourceScale(effect.sourceName, 1000, 500, OBSTransformEaseMode.EaseIn);
        // await settransformableSourcesettings(effect.transformableSourceName, {
        //     text: effect.transformableSource === "static" ? effect.text : null,
        //     readFromFile: effect.transformableSource === "file",
        //     file: effect.transformableSource === "file" ? effect.file : null
        // });
        return true;
    }
};
