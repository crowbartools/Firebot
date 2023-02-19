import { EffectType } from "../../../../../types/effects";
import {
  getSourceVisibility,
  setSourceVisibility,
  SourceData,
} from "../obs-remote";

type SourceAction = boolean | "toggle";

type EffectProperties = {
  selectedSources: Array<{
    sceneName: string;
    sourceId: number;
    groupName?: string;
    action: SourceAction;
  }>;
};

type Scope = {
  effect: EffectProperties;
  [x: string]: any;
};

export const ToggleSourceVisibilityEffectType: EffectType<EffectProperties> =
  {
    definition: {
      id: "ebiggz:obs-toggle-source-visibility",
      name: "Toggle OBS Source Visibility",
      description: "Toggle an OBS source's visibility",
      icon: "fad fa-clone",
      categories: ["common"],
    },
    optionsTemplate: `
    <eos-container header="Sources">
      <div ng-if="sourceData != null" ng-repeat="sceneName in getSceneNames()">
        <div style="font-size: 16px;font-weight: 900;color: #b9b9b9;margin-bottom: 5px;">{{sceneName}}</div>
        <div ng-repeat="source in getSources(sceneName)">
          <label  class="control-fb control--checkbox">{{source.name}}
              <input type="checkbox" ng-click="toggleSourceSelected(sceneName, source.id, source.groupName)" ng-checked="sourceIsSelected(sceneName, source.id)"  aria-label="..." >
              <div class="control__indicator"></div>
          </label>
          <div ng-show="sourceIsSelected(sceneName, source.id)" style="margin-bottom: 15px;">
            <div class="btn-group" uib-dropdown>
                <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
                {{getSourceActionDisplay(sceneName, source.id)}} <span class="caret"></span>
                </button>
                <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                    <li role="menuitem" ng-click="setSourceAction(sceneName, source.id, true)"><a href>Show</a></li>
                    <li role="menuitem" ng-click="setSourceAction(sceneName, source.id, false)"><a href>Hide</a></li>
                    <li role="menuitem" ng-click="setSourceAction(sceneName, source.id, 'toggle')"><a href>Toggle</a></li>
                </ul>
            </div>
          </div>
        </div>
      </div>
      <div ng-if="sourceData == null" class="muted">
        No sources found. Is OBS running?
      </div>
      <p>
          <button class="btn btn-link" ng-click="getSourceData()">Refresh Source Data</button>
      </p>
    </eos-container>
  `,
    optionsController: ($scope: Scope, backendCommunicator: any, $q: any) => {
      $scope.sourceData = null;

      $scope.sceneNames = [];

      if ($scope.effect.selectedSources == null) {
        $scope.effect.selectedSources = [];
      }

      $scope.getSources = (sceneName: string) => {
        return $scope.sourceData ? $scope.sourceData[sceneName] : [];
      };

      $scope.getSceneNames = () => {
        return $scope.sourceData ? Object.keys($scope.sourceData) : [];
      };

      $scope.sourceIsSelected = (sceneName: string, sourceId: number) => {
        return $scope.effect.selectedSources.some(
          (s) => s.sceneName === sceneName && s.sourceId === sourceId
        );
      };

      $scope.toggleSourceSelected = (sceneName: string, sourceId: number, groupName: string) => {
        if ($scope.sourceIsSelected(sceneName, sourceId)) {
          $scope.effect.selectedSources = $scope.effect.selectedSources.filter(
            (s) => !(s.sceneName === sceneName && s.sourceId === sourceId)
          );
        } else {
          $scope.effect.selectedSources.push({
            sceneName,
            sourceId,
            groupName,
            action: true,
          });
        }
      };

      $scope.setSourceAction = (
        sceneName: string,
        sourceId: number,
        action: "toggle" | boolean
      ) => {
        const selectedSource = $scope.effect.selectedSources.find(
          (s) => s.sceneName === sceneName && s.sourceId === sourceId
        );
        if (selectedSource != null) {
          selectedSource.action = action;
        }
      };

      $scope.getSourceActionDisplay = (sceneName: string, sourceId: number) => {
        const selectedSource = $scope.effect.selectedSources.find(
          (s) => s.sceneName === sceneName && s.sourceId === sourceId
        );
        if (selectedSource == null) return "";

        if (selectedSource.action === "toggle") {
          return "Toggle";
        }
        if (selectedSource.action === true) {
          return "Show";
        }
        return "Hide";
      };

      $scope.getSourceData = () => {
        $q.when(backendCommunicator.fireEventAsync("obs-get-source-data")).then(
          (sourceData: SourceData) => {
            $scope.sourceData = sourceData ?? null;
          }
        );
      };
      $scope.getSourceData();
    },
    optionsValidator: () => {
      return [];
    },
    onTriggerEvent: async ({ effect }) => {
      if (effect.selectedSources == null) return true;

      for (const { sceneName, sourceId, action, groupName } of effect.selectedSources) {
        let newVisibility;
        if (action === "toggle") {
          const currentVisibility = await getSourceVisibility(
            groupName ?? sceneName,
            sourceId
          );
          if (currentVisibility == null) continue;
          newVisibility = !currentVisibility;
        } else {
          newVisibility = action === true;
        }

        await setSourceVisibility(groupName ?? sceneName, sourceId, newVisibility);
      }

      return true;
    },
  };
