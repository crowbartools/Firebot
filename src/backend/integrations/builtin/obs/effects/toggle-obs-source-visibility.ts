import { EffectType } from "../../../../../types/effects";
import {
    getSourceVisibility,
    setSourceVisibility,
    SourceData
} from "../obs-remote";

type SourceAction = boolean | "toggle";

type EffectProperties = {
    selectedSources: Array<{
        sceneName: string;
        sourceId: number;
        groupName?: string;
        sourceName?: string;
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
        categories: ["common"]
    },
    optionsTemplate: `
<eos-container ng-show="missingSources.length > 0">
        <div class="effect-info alert alert-warning">
            <p><b>Warning!</b> 
                Cannot find {{missingSources.length}} sources in this effect. Ensure the correct profile or scene collection is loaded in OBS, and OBS is running.
            </p>
        </div>
</eos-container>
<setting-container ng-show="missingSources.length > 0" header="Missing Sources ({{missingSources.length}})" collapsed="true">
    <div ng-repeat="sceneName in missingSources track by $index">
      <div class="list-item" style="display: flex;border: 2px solid #3e4045;box-shadow: none;border-radius: 8px;padding: 5px 5px;">
        <div class="pl-5">
          <span>Scene: {{sceneName.sceneName}},</span>
            <span>Name: {{sceneName.sourceName || 'Unknown'}},</span>
            <span ng-if="sceneName.sourceName == null">Id: {{sceneName.sourceId}},</span>
            <span>Action: {{getMissingActionDisplay(sceneName.action)}}</span>
        </div>   
        <div>
            <button class="btn btn-danger" ng-click="deleteSceneAtIndex($index)"><i class="far fa-trash"></i></button>
        </div>
      </div>
    </div>
</setting-container>

<eos-container header="Sources" pad-top="missingSources.length > 0">
  <div class="effect-setting-container">
    <div class="input-group">
      <span class="input-group-addon">Filter</span>
      <input type="text" class="form-control" ng-change="filterScenes(searchText)" ng-model="searchText" placeholder="Enter your search term here..." aria-describeby="obs-visibility-search-box">
    </div>
  </div>

  <div>
      <button class="btn btn-link" ng-click="getSourceData()">Refresh Source Data</button>
  </div>

  <div class="effect-setting-container setting-padtop">
    <div ng-if="sourceData != null" ng-repeat="sceneName in sceneNames">
      <div style="font-size: 16px;font-weight: 900;color: #b9b9b9;margin-bottom: 5px;">{{sceneName}}</div>
      <div ng-repeat="source in getSources(sceneName) | filter: {name: searchText}">
        <label  class="control-fb control--checkbox">{{source.name}}
            <input type="checkbox" ng-click="toggleSourceSelected(sceneName, source.id, source.groupName, source.name)" ng-checked="sourceIsSelected(sceneName, source.id)"  aria-label="..." >
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
        No sources found. {{ isObsConfigured ? "Is OBS running?" : "Have you configured the OBS integration?" }}
    </div>
  </div>
</eos-container>
`,
    optionsController: ($scope: Scope, backendCommunicator: any, $q: any) => {
        $scope.isObsConfigured = false;

        $scope.sourceData = null;

        $scope.sceneNames = [];

        $scope.missingSources = [];

        if ($scope.effect.selectedSources == null) {
            $scope.effect.selectedSources = [];
        }

        $scope.getSources = (sceneName: string) => {
            return $scope.sourceData ? $scope.sourceData[sceneName] : [];
        };

        $scope.getSceneNames = () => {
            return $scope.sourceData ? Object.keys($scope.sourceData) : [];
        };

        $scope.filterScenes = (filter = "") => {
            $scope.sceneNames = [];
            if ($scope.sourceData == null) {
                return;
            }

            for (const sceneName of $scope.getSceneNames()) {
                if ($scope.getSources(sceneName).filter(source => source.name.toLowerCase().includes(filter.toLowerCase())).length > 0) {
                    $scope.sceneNames.push(sceneName);
                }
            }
        };

        $scope.sourceIsSelected = (sceneName: string, sourceId: number) => {
            return $scope.effect.selectedSources.some(
                s => s.sceneName === sceneName && s.sourceId === sourceId
            );
        };

        $scope.toggleSourceSelected = (sceneName: string, sourceId: number, groupName: string, sourceName: string) => {
            if ($scope.sourceIsSelected(sceneName, sourceId)) {
                $scope.effect.selectedSources = $scope.effect.selectedSources.filter(
                    s => !(s.sceneName === sceneName && s.sourceId === sourceId)
                );
            } else {
                $scope.effect.selectedSources.push({
                    sceneName,
                    sourceId,
                    groupName,
                    sourceName,
                    action: true
                });
            }
        };

        $scope.setSourceAction = (
            sceneName: string,
            sourceId: number,
            action: "toggle" | boolean
        ) => {
            const selectedSource = $scope.effect.selectedSources.find(
                s => s.sceneName === sceneName && s.sourceId === sourceId
            );
            if (selectedSource != null) {
                selectedSource.action = action;
            }
        };

        $scope.getSourceActionDisplay = (sceneName: string, sourceId: number) => {
            const selectedSource = $scope.effect.selectedSources.find(
                s => s.sceneName === sceneName && s.sourceId === sourceId
            );

            $scope.missingSources = $scope.missingSources.filter(item => item !== selectedSource);

            if (selectedSource == null) {
                return "";
            }

            if (selectedSource.action === "toggle") {
                return "Toggle";
            }
            if (selectedSource.action === true) {
                return "Show";
            }
            return "Hide";
        };

        $scope.getMissingActionDisplay = (
            selectedFilter: unknown
        ) => {
            if (selectedFilter == null) {
                return "";
            }
            if (selectedFilter === "toggle") {
                return "Toggle";
            }
            if (selectedFilter === true) {
                return "Enable";
            }
            return "Disable";
        };

        $scope.deleteSceneAtIndex = (index: number) => {
            $scope.effect.selectedSources = $scope.effect.selectedSources.filter(
                item => item !== $scope.missingSources [index]
            );
            $scope.missingSources.splice(index, 1);
        };

        $scope.getStoredData = () => {
            for (const sceneName of $scope.effect.selectedSources) {
                $scope.missingSources.push(sceneName);
            }
        };

        $scope.getSourceData = () => {
            $scope.isObsConfigured = backendCommunicator.fireEventSync("obs-is-configured");

            $q.when(backendCommunicator.fireEventAsync("obs-get-source-data")).then(
                (sourceData: SourceData) => {
                    $scope.sourceData = sourceData ?? null;
                    $scope.filterScenes();
                }
            );
        };
        $scope.getSourceData();
        $scope.getStoredData();
    },
    optionsValidator: () => {
        return [];
    },
    onTriggerEvent: async ({ effect }) => {
        if (effect.selectedSources == null) {
            return true;
        }

        for (const { sceneName, sourceId, action, groupName } of effect.selectedSources) {
            let newVisibility;
            if (action === "toggle") {
                const currentVisibility = await getSourceVisibility(
                    groupName ?? sceneName,
                    sourceId
                );
                if (currentVisibility == null) {
                    continue;
                }
                newVisibility = !currentVisibility;
            } else {
                newVisibility = action === true;
            }

            await setSourceVisibility(groupName ?? sceneName, sourceId, newVisibility);
        }

        return true;
    }
};