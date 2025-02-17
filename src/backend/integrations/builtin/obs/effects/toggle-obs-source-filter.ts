import { EffectType } from "../../../../../types/effects";
import {
    getFilterEnabledStatus,
    OBSSource,
    setFilterEnabled
} from "../obs-remote";

type SourceAction = boolean | "toggle";

type EffectProperties = {
    selectedFilters: Array<{
        sourceName: string;
        filterName: string;
        action: SourceAction;
    }>;
};

type Scope = {
    effect: EffectProperties;
    [x: string]: any;
};

export const ToggleSourceFilterEffectType: EffectType<EffectProperties> =
  {
      definition: {
          id: "ebiggz:obs-toggle-source-filter",
          name: "Toggle OBS Filter",
          description: "Toggle filters for OBS sources and scenes",
          icon: "fad fa-stars",
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
    <setting-container ng-show="missingSources.length > 0" header="Missing Filters ({{missingSources.length}})" collapsed="true">
        <div ng-repeat="filterName in missingSources track by $index">
          <div class="list-item" style="display: flex;border: 2px solid #3e4045;box-shadow: none;border-radius: 8px;padding: 5px 5px;">
            <div class="pl-5">
                <span>Source: {{filterName.sourceName}},</span>
                <span>Name: {{filterName.filterName}},</span>
                <span>Action: {{getMissingActionDisplay(filterName.action)}}</span>
            </div>   
            <div>
                  <button class="btn btn-danger" ng-click="deleteSceneAtIndex($index)"><i class="far fa-trash"></i></button>
            </div>
          </div>
        </div>
    </setting-container>

    <eos-container header="Filters" pad-top="missingSources.length > 0">
      <div class="effect-setting-container">
        <div class="input-group">
          <span class="input-group-addon">Filter</span>
          <input type="text" class="form-control" ng-change="filterSources(searchText)" ng-model="searchText" placeholder="Enter your search term here..." aria-describeby="obs-visibility-search-box">
        </div>
      </div>
      <div>
          <button class="btn btn-link" ng-click="getSourceList()">Refresh Filter Data</button>
      </div>
      <div ng-if="sourceList != null && sourceList.length > 0" ng-repeat="source in sourceListFiltered">
        <div style="font-size: 16px;color: #b9b9b9;margin-bottom: 5px;"><b>{{source.name}}</b> <span style="font-size: 13px;">({{formatSourceType(source.typeId)}})</span></div>
        <div ng-repeat="filter in source.filters | filter: {name: searchText}">
          <label  class="control-fb control--checkbox">{{filter.name}}
              <input type="checkbox" ng-click="toggleFilterSelected(source.name, filter.name)" ng-checked="filterIsSelected(source.name, filter.name)"  aria-label="..." >
              <div class="control__indicator"></div>
          </label>
          <div ng-show="filterIsSelected(source.name, filter.name)" style="margin-bottom: 15px;">
            <div class="btn-group" uib-dropdown>
                <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
                {{getFilterActionDisplay(source.name, filter.name)}} <span class="caret"></span>
                </button>
                <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                    <li role="menuitem" ng-click="setFilterAction(source.name, filter.name, true)"><a href>Enable</a></li>
                    <li role="menuitem" ng-click="setFilterAction(source.name, filter.name, false)"><a href>Disable</a></li>
                    <li role="menuitem" ng-click="setFilterAction(source.name, filter.name, 'toggle')"><a href>Toggle</a></li>
                </ul>
            </div>
          </div>
        </div>
      </div>
      <div ng-if="sourceList != null && sourceList.length < 1" class="muted">
        No sources with filters found.
      </div>
      <div ng-if="sourceList == null" class="muted">
        No sources found. {{ isObsConfigured ? "Is OBS running?" : "Have you configured the OBS integration?" }}
      </div>
    </eos-container>
  `,
      optionsController: ($scope: Scope, backendCommunicator: any, $q: any) => {
          $scope.isObsConfigured = false;

          $scope.sourceList = null;

          $scope.searchText = "";

          $scope.missingSources = [];

          if ($scope.effect.selectedFilters == null) {
              $scope.effect.selectedFilters = [];
          }

          $scope.filterIsSelected = (sourceName: string, filterName: string) => {
              return $scope.effect.selectedFilters.some(
                  s => s.sourceName === sourceName && s.filterName === filterName
              );
          };

          $scope.toggleFilterSelected = (
              sourceName: string,
              filterName: string
          ) => {
              if ($scope.filterIsSelected(sourceName, filterName)) {
                  $scope.effect.selectedFilters = $scope.effect.selectedFilters.filter(
                      s => !(s.sourceName === sourceName && s.filterName === filterName)
                  );
              } else {
                  $scope.effect.selectedFilters.push({
                      sourceName,
                      filterName,
                      action: true
                  });
              }
          };

          $scope.setFilterAction = (
              sourceName: string,
              filterName: string,
              action: "toggle" | boolean
          ) => {
              const selectedFilter = $scope.effect.selectedFilters.find(
                  s => s.sourceName === sourceName && s.filterName === filterName
              );
              if (selectedFilter != null) {
                  selectedFilter.action = action;
              }
          };

          $scope.getFilterActionDisplay = (
              sourceName: string,
              filterName: string
          ) => {
              const selectedFilter = $scope.effect.selectedFilters.find(
                  s => s.sourceName === sourceName && s.filterName === filterName
              );

              $scope.missingSources = $scope.missingSources.filter(item => item !== selectedFilter);

              if (selectedFilter == null) {
                  return "";
              }

              if (selectedFilter.action === "toggle") {
                  return "Toggle";
              }
              if (selectedFilter.action === true) {
                  return "Enable";
              }
              return "Disable";
          };

          $scope.getMissingActionDisplay = (
              selectedFilter: unknown
          ) => {
              console.log(selectedFilter);
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

          $scope.filterSources = (searchText: string) => {
              if ($scope.searchText !== searchText) {
                  $scope.searchText = searchText;
              }
              $scope.sourceListFiltered = ($scope.sourceList as Array<OBSSource>).filter((source: OBSSource) => {
                  return source.filters.some((filter) => {
                      return filter.name.toLowerCase().includes(searchText.toLowerCase());
                  });
              });
          };

          $scope.deleteSceneAtIndex = (index: number) => {
              $scope.effect.selectedFilters = $scope.effect.selectedFilters.filter(
                  item => item !== $scope.missingSources [index]
              );
              $scope.missingSources.splice(index, 1);
          };

          $scope.getStoredData = () => {
              for (const filterName of $scope.effect.selectedFilters) {
                  $scope.missingSources.push(filterName);
              }
          };

          $scope.getSourceList = () => {
              $scope.isObsConfigured = backendCommunicator.fireEventSync("obs-is-configured");

              $q.when(
                  backendCommunicator.fireEventAsync("obs-get-sources-with-filters")
              ).then((sourceList: Array<OBSSource>) => {
                  $scope.sourceList = sourceList ?? null;
                  $scope.filterSources($scope.searchText);
              });
          };

          $scope.getSourceList();
          $scope.getStoredData();
      },
      optionsValidator: () => {
          return [];
      },
      onTriggerEvent: async ({ effect }) => {
          if (effect.selectedFilters == null) {
              return true;
          }

          for (const { sourceName, filterName, action } of effect.selectedFilters) {
              let newVisibility;
              if (action === "toggle") {
                  const currentVisibility = await getFilterEnabledStatus(
                      sourceName,
                      filterName
                  );
                  if (currentVisibility == null) {
                      continue;
                  }
                  newVisibility = !currentVisibility;
              } else {
                  newVisibility = action === true;
              }

              await setFilterEnabled(sourceName, filterName, newVisibility);
          }

          return true;
      }
  };
