import { EffectType } from "../../../../../types/effects";
import { setCurrentScene } from "../obs-remote";

export const ChangeSceneEffectType: EffectType<{
    sceneName: string;
}> = {
    definition: {
        id: "ebiggz:obs-change-scene",
        name: "Change OBS Scene",
        description: "Change the active OBS Scene",
        icon: "fad fa-tv",
        categories: ["common"]
    },
    optionsTemplate: `
    <eos-container header="New Scene">
        <div ng-hide="effect.custom === true">
            <button class="btn btn-link" ng-click="getScenes()">Refresh Scenes</button>
            <span class="muted">(Make sure {{ isObsConfigured ? "" : "the OBS integration is configured and " }}OBS is running)</span>
        </div>

        <ui-select ng-model="selected" on-select="selectScene($select.selected)">
          <ui-select-match placeholder="Select a Scene...">{{$select.selected.name}}</ui-select-match>
          <ui-select-choices repeat="scene in scenes | filter: {name: $select.search}">
            <li ng-show="scene.custom === true" role="separator" class="divider"></li>
            <div ng-bind-html="scene.name | highlight: $select.search"></div>
          </ui-select-choices>
        </ui-select>

        <div ng-show="effect.custom === true" style="margin-top:10px;">
            <firebot-input input-title="Custom Scene" model="effect.sceneName" menu-position="under"></firebot-input>
        </div>
    </eos-container>
  `,
    optionsController: ($scope: any, backendCommunicator: any, $q: any) => {
        $scope.isObsConfigured = false;

        $scope.scenes = [];

        $scope.customScene = {name: "Set Custom", custom: true};

        $scope.selectScene = (scene: {name: string, custom: boolean}) => {
            $scope.effect.custom = scene.custom;
            if (!scene.custom) {
                $scope.effect.sceneName = scene.name;
            }
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
                        $scope.selected = $scope.customScene;
                    } else {
                        $scope.selected = $scope.scenes.find(scene => scene.name === $scope.effect.sceneName);
                    }
                }
            );
        };
        $scope.getScenes();
    },
    optionsValidator: (effect) => {
        if (effect.sceneName == null) {
            return ["Please select a scene."];
        }
        return [];
    },
    getDefaultLabel: (effect) => {
        return effect.sceneName;
    },
    onTriggerEvent: async ({ effect }) => {
        await setCurrentScene(effect.sceneName);
        return true;
    }
};
