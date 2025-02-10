import { EffectType } from "../../../../../types/effects";
import { OBSSource, setSourceMuted, toggleSourceMuted } from "../obs-remote";

type SourceAction = boolean | "toggle";

type EffectProperties = {
    selectedSources: Array<{
        sourceName: string;
        action: SourceAction;
    }>;
};

type Scope = {
    effect: EffectProperties;
    [x: string]: any;
};

export const ToggleSourceMutedEffectType: EffectType<EffectProperties> =
  {
      definition: {
          id: "ebiggz:obs-toggle-source-muted",
          name: "Toggle OBS Audio Source Muted",
          description: "Toggle an OBS source's muted status",
          icon: "fad fa-volume-mute",
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
    <setting-container ng-show="missingSources.length > 0" header="Missing Audio Sources ({{missingSources.length}})" collapsed="true">
        <div ng-repeat="sourceList in missingSources track by $index">
          <div class="list-item" style="display: flex;border: 2px solid #3e4045;box-shadow: none;border-radius: 8px;padding: 5px 5px;">
            <div class="pl-5">
                <span>Source: {{sourceList.sourceName}}</span>
            </div>   
            <div>
                <button class="btn btn-danger" ng-click="deleteSceneAtIndex($index)"><i class="far fa-trash"></i></button>
            </div>
          </div>
        </div>
    </setting-container>

    <eos-container header="Audio Sources" pad-top="missingSources.length > 0">
      <firebot-input model="searchText" input-title="Filter" disable-variables="true"></firebot-input>
      <div>
          <button class="btn btn-link" ng-click="getSourceList()">Refresh Sources</button>
      </div>
      <div ng-if="sourceList != null && sourceList.length > 0" ng-repeat="source in sourceList | filter: {name: searchText}">
          <label  class="control-fb control--checkbox">{{source.name}}
              <input type="checkbox" ng-click="toggleSourceSelected(source.name)" ng-checked="sourceIsSelected(source.name)"  aria-label="..." >
              <div class="control__indicator"></div>
          </label>
          <div ng-show="sourceIsSelected(source.name)" style="margin-bottom: 15px;">
            <div class="btn-group" uib-dropdown>
                <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
                {{getSourceActionDisplay(source.name)}} <span class="caret"></span>
                </button>
                <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                    <li role="menuitem" ng-click="setSourceAction(source.name, true)"><a href>Mute</a></li>
                    <li role="menuitem" ng-click="setSourceAction(source.name, false)"><a href>Unmute</a></li>
                    <li role="menuitem" ng-click="setSourceAction(source.name, 'toggle')"><a href>Toggle</a></li>
                </ul>
            </div>
          </div>
        </div>
      <div ng-if="sourceList != null && sourceList.length < 1" class="muted">
        No audio sources found.
      </div>
      <div ng-if="sourceList == null" class="muted">
        No sources found. {{ isObsConfigured ? "Is OBS running?" : "Have you configured the OBS integration?" }}
      </div>
    </eos-container>
  `,
      optionsController: ($scope: Scope, backendCommunicator: any, $q: any) => {
          $scope.isObsConfigured = false;

          $scope.sourceList = null;

          $scope.missingSources = [];

          if ($scope.effect.selectedSources == null) {
              $scope.effect.selectedSources = [];
          }

          $scope.sourceIsSelected = (sourceName: string) => {
              return $scope.effect.selectedSources.some(
                  s => s.sourceName === sourceName
              );
          };

          $scope.toggleSourceSelected = (sourceName: string) => {
              if ($scope.sourceIsSelected(sourceName)) {
                  $scope.effect.selectedSources = $scope.effect.selectedSources.filter(
                      s => !(s.sourceName === sourceName)
                  );
              } else {
                  $scope.effect.selectedSources.push({
                      sourceName,
                      action: true
                  });
              }
          };

          $scope.setSourceAction = (
              sourceName: string,
              action: "toggle" | boolean
          ) => {
              const selectedSource = $scope.effect.selectedSources.find(
                  s => s.sourceName === sourceName
              );
              if (selectedSource != null) {
                  selectedSource.action = action;
              }
          };

          $scope.getSourceActionDisplay = (sourceName: string) => {
              const selectedSource = $scope.effect.selectedSources.find(
                  s => s.sourceName === sourceName
              );

              $scope.missingSources = $scope.missingSources.filter(item => item !== selectedSource);

              if (selectedSource == null) {
                  return "";
              }

              if (selectedSource.action === "toggle") {
                  return "Toggle";
              }
              if (selectedSource.action === true) {
                  return "Mute";
              }
              return "Unmute";
          };

          const capitalizeWords = (input: string) =>
              input
                  .split(" ")
                  .map(
                      w => w[0].toLocaleUpperCase() + w.substr(1).toLocaleLowerCase()
                  )
                  .join(" ");

          $scope.formatSourceType = (type: string) => {
              return capitalizeWords((type ?? "").replace(/_/, " "));
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

          $scope.getSourceList = () => {
              $scope.isObsConfigured = backendCommunicator.fireEventSync("obs-is-configured");

              $q.when(
                  backendCommunicator.fireEventAsync("obs-get-audio-sources")
              ).then((sourceList: Array<OBSSource>) => {
                  $scope.sourceList = sourceList ?? null;
              });
          };

          $scope.getSourceList();
          $scope.getStoredData();
      },
      optionsValidator: () => {
          return [];
      },
      onTriggerEvent: async ({ effect }) => {
          if (effect.selectedSources == null) {
              return true;
          }

          for (const { sourceName, action } of effect.selectedSources) {
              if (action === "toggle") {
                  await toggleSourceMuted(sourceName);
              } else {
                  await setSourceMuted(sourceName, action);
              }
          }

          return true;
      }
  };
