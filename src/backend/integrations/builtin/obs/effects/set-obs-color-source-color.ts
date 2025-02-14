import logger from "../../../../logwrapper";
import { EffectType } from "../../../../../types/effects";
import { OBSSource, setColorSourceSettings } from "../obs-remote";

export const SetOBSColorSourceColorEffectType: EffectType<{
    colorSourceName: string;
    color: string;
    customColor: boolean;
}> = {
    definition: {
        id: "firebot:obs-set-color-source-color",
        name: "Set OBS Color Source Color",
        description: "Sets the color in an OBS color source",
        icon: "fad fa-palette",
        categories: ["common"]
    },
    optionsTemplate: `
    <eos-container header="OBS Color Source">
        <div>
            <button class="btn btn-link" ng-click="getColorSources()">Refresh Source Data</button>
        </div>

        <ui-select ng-if="colorSources != null" ng-model="selected" on-select="selectColorSource($select.selected.name)">
            <ui-select-match placeholder="Select a Color Source...">{{$select.selected.name}}</ui-select-match>
            <ui-select-choices repeat="source in colorSources | filter: $select.search">
                <li ng-show="scene.custom === true" role="separator" class="divider"></li>
                <div ng-bind-html="source.name | highlight: $select.search"></div>
            </ui-select-choices>
            <ui-select-no-choice>
                <b>No color sources found.</b>
            </ui-select-no-choice>
        </ui-select>

        <div ng-if="colorSources == null" class="muted">
            No sources found. {{ isObsConfigured ? "Is OBS running?" : "Have you configured the OBS integration?" }}
        </div>
    </eos-container>

    <eos-container ng-if="colorSources != null && effect.colorSourceName != null" header="Color" style="margin-top: 10px;" pad-top="true">
        <firebot-checkbox
            label="Use Custom Color"
            tooltip="Allow entering custom hex colors or replace variables. Will fail if the result is not a valid hex color."
            model="effect.customColor"
            on-change="toggleCustomColor(newValue)"
            class="mb4"
        />
        <firebot-input
            input-title="#ARGB"
            ng-if="effect.customColor"
            model="effect.color"
            placeholder-text="Format: #0066FF or #FF336699"
        />
        <color-picker-input label="#RGBA" ng-if="!effect.customColor" model="effect.color" alpha="true" lg-input="true"></color-picker-input>
    </eos-container>
  `,
    optionsController: ($scope: any, backendCommunicator: any, $q: any) => {
        const rgbRegexp = /^#?[0-9a-f]{6}$/i;
        const argbRegexp = /^#?[0-9a-f]{8}$/i;

        if ($scope.effect.color != null && $scope.effect.customColor == null) {
            $scope.effect.customColor = true;
        }

        if ($scope.effect.customColor == null) {
            $scope.effect.customColor = false;
        }

        function argbToRgba(hexColor: string) {
            hexColor = hexColor.replace("#", "");
            return `${hexColor.substring(2, 4)}${hexColor.substring(4, 6)}${hexColor.substring(6, 8)}${hexColor.substring(0, 2)}`;
        }

        function rgbaToArgb(hexColor: string) {
            hexColor = hexColor.replace("#", "");
            return `${hexColor.substring(6, 8)}${hexColor.substring(0, 2)}${hexColor.substring(2, 4)}${hexColor.substring(4, 6)}`;
        }

        if ($scope.effect.color == null) {
            $scope.effect.color = "#FF0000FF";
        }

        $scope.isObsConfigured = false;

        $scope.colorSources = [];

        $scope.selectColorSource = (colorSourceName: string) => {
            $scope.effect.colorSourceName = colorSourceName;
        };

        $scope.toggleCustomColor = (newValue: boolean) => {
            // Ignore the conversion when variables are included or when only RGB is provided
            if ((
                !rgbRegexp.test($scope.effect.color) &&
                !argbRegexp.test($scope.effect.color)
            ) || (
                rgbRegexp.test($scope.effect.color) &&
                !argbRegexp.test($scope.effect.color)
            )) {
                return;
            }

            $scope.effect.color = `#${newValue ? rgbaToArgb($scope.effect.color) : argbToRgba($scope.effect.color)}`;
        };

        $scope.getColorSources = () => {
            $scope.isObsConfigured = backendCommunicator.fireEventSync("obs-is-configured");

            $q.when(
                backendCommunicator.fireEventAsync("obs-get-color-sources")
            ).then((colorSources: OBSSource[]) => {
                $scope.colorSources = colorSources;
                $scope.selected = $scope.colorSources?.find(source => source.name === $scope.effect.colorSourceName);
            });
        };
        $scope.getColorSources();
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];
        const rgbRegexp = /^#?[0-9a-f]{6}$/i;
        const argbRegexp = /^#?[0-9a-f]{8}$/i;

        if (effect.colorSourceName == null) {
            errors.push("Please select a color source");
        } else if (!effect.customColor && !rgbRegexp.test(effect.color) && !argbRegexp.test(effect.color)) {
            errors.push("Color must be in RGB format (#0066FF) or ARGB format (#FF336699)");
        }

        return errors;
    },
    getDefaultLabel: (effect) => {
        return effect.colorSourceName;
    },
    onTriggerEvent: async ({ effect }) => {
        const rgbRegexp = /^#?[0-9a-f]{6}$/i;
        const argbRegexp = /^#?[0-9a-f]{8}$/i;

        function argbToAbgr(hexColor: string) {
            return `${hexColor.substring(0, 2)}${hexColor.substring(6, 8)}${hexColor.substring(4, 6)}${hexColor.substring(2, 4)}`;
        }

        function rgbaToAbgr(hexColor: string) {
            return `${hexColor.substring(6, 8)}${hexColor.substring(4, 6)}${hexColor.substring(2, 4)}${hexColor.substring(0, 2)}`;
        }

        if (!rgbRegexp.test(effect.color) && !argbRegexp.test(effect.color)) {
            logger.error(`Set OBS Color Source: '${effect.color}' is not a valid (A)RGB color code.`);
            return false;
        }
        const hexColor = effect.color.replace("#", "");
        let obsFormattedHexColor = "";

        // OBS likes the color values in the OTHER direction
        if (effect.customColor === false) {
            obsFormattedHexColor = rgbaToAbgr(hexColor);
        } else if (hexColor.length === 8) {
            obsFormattedHexColor = argbToAbgr(hexColor);
        } else {
            obsFormattedHexColor = argbToAbgr(`FF${hexColor}`);
        }

        const intColorValue = parseInt(obsFormattedHexColor, 16);

        await setColorSourceSettings(effect.colorSourceName, {
            color: intColorValue
        });
        return true;
    }
};
