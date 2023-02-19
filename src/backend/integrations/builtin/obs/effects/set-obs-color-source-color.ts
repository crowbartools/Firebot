import { EffectType } from "../../../../../types/effects";
import { OBSSource, setColorSourceSettings } from "../obs-remote";

export const SetOBSColorSourceColorEffectType: EffectType<{
  colorSourceName: string;
  color: string;
}> = {
  definition: {
    id: "firebot:obs-set-color-source-color",
    name: "Set OBS Color Source Color",
    description: "Sets the color in an OBS color source",
    icon: "fad fa-palette",
    categories: ["common"],
  },
  optionsTemplate: `
    <eos-container header="OBS Color Source">
        <div ng-if="colorSources != null" class="btn-group" uib-dropdown>
            <button type="button" class="btn btn-default" uib-dropdown-toggle>
              {{effect.colorSourceName}} <span class="caret"></span>
            </button>
            <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                <li role="menuitem" ng-repeat="colorSource in colorSources" ng-click="selectColorSource(colorSource.name)">
                    <a href>{{colorSource.name}}</a>
                </li>
                <li role="menuitem" ng-show="colorSources.length < 1" class="muted">
                    <a>No color sources found.</a>
                </li>
            </ul>
        </div>
        <div ng-if="colorSources == null" class="muted">
            No sources found. Is OBS running?
        </div>
        <p>
            <button class="btn btn-link" ng-click="getColorSources()">Refresh Source Data</button>
        </p>
    </eos-container>

    <eos-container ng-if="colorSources != null && effect.colorSourceName != null" header="Color" style="margin-top: 10px;">
        <firebot-input model="effect.color" placeholder-text="Format: #0066FF or #FF336699"></firebot-input>
    </eos-container>
  `,
  optionsController: ($scope: any, backendCommunicator: any, $q: any) => {
    $scope.colorSources = [];

    $scope.selectColorSource = (colorSourceName: string) => {
      $scope.effect.colorSourceName = colorSourceName;
    };

    $scope.getColorSources = () => {
      $q.when(
        backendCommunicator.fireEventAsync("obs-get-color-sources")
      ).then((colorSources: OBSSource[]) => {
        $scope.colorSources = colorSources ?? [];
      });
    };
    $scope.getColorSources();
  },
  optionsValidator: (effect) => {
    const errors: string[] = [];
    const rgbRegexp = /^#?[0-9a-f]{6}$/ig;
    const argbRegexp = /^#?[0-9a-f]{8}$/ig;

    if (effect.colorSourceName == null) {
      errors.push("Please select a color source");
    } else if (!rgbRegexp.test(effect.color) && !argbRegexp.test(effect.color)) {
      errors.push("Color must be in RGB format (#0066FF) or ARGB format (#FF336699)");
    }

    return errors;
  },
  onTriggerEvent: async ({ effect }) => {
    const hexColor = effect.color.replace("#", "");
    let obsFormattedHexColor = "";

    // OBS likes the color values in the OTHER direction
    if (hexColor.length === 8) {
      obsFormattedHexColor = `${hexColor.substring(0,2)}${hexColor.substring(6,8)}${hexColor.substring(4,6)}${hexColor.substring(2,4)}`;
    } else {
      obsFormattedHexColor = `${hexColor.substring(4,6)}${hexColor.substring(2,4)}${hexColor.substring(0,2)}`;
    }

    const intColorValue = parseInt(obsFormattedHexColor, 16);

    await setColorSourceSettings(effect.colorSourceName, {
      color: intColorValue
    });
    return true;
  },
};
