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
    categories: ["common"],
  },
  optionsTemplate: `
    <eos-container header="New Scene">
        <div class="btn-group" uib-dropdown>
            <button type="button" class="btn btn-default" uib-dropdown-toggle>
              {{effect.custom ? 'Custom': effect.sceneName}} <span class="caret"></span>
            </button>
            <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                <li role="menuitem" ng-repeat="scene in scenes" ng-click="selectScene(scene)">
                    <a href>{{scene}}</a>
                </li>
                <li role="menuitem" ng-show="scenes.length < 1" class="muted">
                    <a>No scenes found.</a>
                </li>
                <li role="separator" class="divider"></li>
                <li role="menuitem" ng-click="effect.custom = true;">
                    <a href>Set custom</a>
                </li>
            </ul>
        </div>
        <p>
            <button class="btn btn-link" ng-click="getScenes()">Refresh Scenes</button>
            <span class="muted">(Make sure OBS is running)</span>
        </p>
        <div ng-show="effect.custom === true" style="margin-top:10px;">
            <firebot-input input-title="Custom Scene" model="effect.sceneName"></firebot-input>
        </div>
    </eos-container>
  `,
  optionsController: ($scope: any, backendCommunicator: any, $q: any) => {
    $scope.scenes = [];

    $scope.selectScene = (scene: string) => {
      $scope.effect.custom = false;
      $scope.effect.sceneName = scene;
    };

    $scope.getScenes = () => {
      $q.when(backendCommunicator.fireEventAsync("obs-get-scene-list")).then(
        (scenes: string[]) => {
          $scope.scenes = scenes ?? [];
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
  onTriggerEvent: async ({ effect }) => {
    await setCurrentScene(effect.sceneName);
    return true;
  },
};
