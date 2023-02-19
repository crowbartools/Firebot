import { EffectType } from "../../../../../types/effects";
import { setCurrentSceneCollection } from "../obs-remote";

export const ChangeSceneCollectionEffectType: EffectType<{
  sceneCollectionName: string;
}> = {
  definition: {
    id: "ebiggz:obs-change-scene-collection",
    name: "Change OBS Scene Collection",
    description: "Change the active OBS Scene Collection",
    icon: "fad fa-th-list",
    categories: ["common"],
  },
  optionsTemplate: `
    <eos-container header="New Scene Collection">
        <div class="btn-group" uib-dropdown>
            <button type="button" class="btn btn-default" uib-dropdown-toggle>
              {{effect.custom ? 'Custom': effect.sceneCollectionName}} <span class="caret"></span>
            </button>
            <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                <li role="menuitem" ng-repeat="sceneCollection in sceneCollections" ng-click="selectSceneCollection(sceneCollection)">
                    <a href>{{sceneCollection}}</a>
                </li>
                <li role="menuitem" ng-show="sceneCollections.length < 1" class="muted">
                    <a>No scene collections found.</a>
                </li>
                <li role="separator" class="divider"></li>
                <li role="menuitem" ng-click="effect.custom = true;">
                    <a href>Set custom</a>
                </li>
            </ul>
        </div>
        <p>
            <button class="btn btn-link" ng-click="getSceneCollections()">Refresh Scene Collections</button>
            <span class="muted">(Make sure OBS is running)</span>
        </p>
        <div ng-show="effect.custom === true" style="margin-top:10px;">
            <firebot-input input-title="Custom Scene Collection" model="effect.sceneCollectionName"></firebot-input>
        </div>
    </eos-container>
  `,
  optionsController: ($scope: any, backendCommunicator: any, $q: any) => {
    $scope.sceneCollections = [];

    $scope.selectSceneCollection = (sceneCollection: string) => {
      $scope.effect.custom = false;
      $scope.effect.sceneCollectionName = sceneCollection;
    };

    $scope.getSceneCollections = () => {
      $q.when(
        backendCommunicator.fireEventAsync("obs-get-scene-collection-list")
      ).then((sceneCollections: string[]) => {
        $scope.sceneCollections = sceneCollections ?? [];
      });
    };
    $scope.getSceneCollections();
  },
  optionsValidator: (effect) => {
    if (effect.sceneCollectionName == null) {
      return ["Please select a scene collection."];
    }
    return [];
  },
  onTriggerEvent: async ({ effect }) => {
    await setCurrentSceneCollection(effect.sceneCollectionName);
    return true;
  },
};
