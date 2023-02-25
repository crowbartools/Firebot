import { EffectType } from "../../../../../types/effects";
import { OBSSource, setBrowserSourceSettings } from "../obs-remote";

export const SetOBSBrowserSourceUrlEffectType: EffectType<{
  browserSourceName: string;
  url: string;
}> = {
  definition: {
    id: "firebot:obs-set-browser-source-url",
    name: "Set OBS Browser Source URL",
    description: "Sets the URL in an OBS browser source",
    icon: "fad fa-browser",
    categories: ["common"],
  },
  optionsTemplate: `
    <eos-container header="OBS Browser Source">
        <div ng-if="browserSources != null" class="btn-group" uib-dropdown>
            <button type="button" class="btn btn-default" uib-dropdown-toggle>
              {{effect.browserSourceName}} <span class="caret"></span>
            </button>
            <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                <li role="menuitem" ng-repeat="browserSource in browserSources" ng-click="selectBrowserSource(browserSource.name)">
                    <a href>{{browserSource.name}}</a>
                </li>
                <li role="menuitem" ng-show="browserSources.length < 1" class="muted">
                    <a>No browser sources found.</a>
                </li>
            </ul>
        </div>
        <div ng-if="browserSources == null" class="muted">
            No sources found. Is OBS running?
        </div>
        <p>
            <button class="btn btn-link" ng-click="getBrowserSources()">Refresh Source Data</button>
        </p>
    </eos-container>
    <eos-container ng-if="browserSources != null && effect.browserSourceName != null" header="URL" style="margin-top: 10px;">
        <firebot-input model="effect.url"></firebot-input>
    </eos-container>
  `,
  optionsController: ($scope: any, backendCommunicator: any, $q: any) => {
    $scope.browserSources = [];

    $scope.selectBrowserSource = (browserSourceName: string) => {
      $scope.effect.browserSourceName = browserSourceName;
    };

    $scope.getBrowserSources = () => {
      $q.when(
        backendCommunicator.fireEventAsync("obs-get-browser-sources")
      ).then((browserSources: OBSSource[]) => {
        $scope.browserSources = browserSources ?? [];
      });
    };
    $scope.getBrowserSources();
  },
  optionsValidator: (effect) => {
    if (effect.browserSourceName == null) {
      return ["Please select a browser source."];
    }
    return [];
  },
  onTriggerEvent: async ({ effect }) => {
    await setBrowserSourceSettings(effect.browserSourceName, {
      url: effect.url
    });
    return true;
  },
};
