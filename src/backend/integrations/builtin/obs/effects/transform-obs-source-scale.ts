import { EffectType } from "../../../../../types/effects";
import { OBSSource, OBSTransformEaseMode, transformSourceScale } from "../obs-remote";

export const TransformSourceScaleEffectType: EffectType<{
    transformableSourceName: string;
    isAnimated: boolean;
    text: string;
    file: string;
}> = {
    definition: {
        id: "firebot:obs-transform-source-scale",
        name: "Transform OBS Source Scale",
        description: "Transforms the scale of an OBS source either instantly or animated over time",
        icon: "fad fa-font-case",
        categories: ["common"]
    },
    optionsTemplate: `
    <eos-container header="OBS Source">
        <div>
            <button class="btn btn-link" ng-click="getTransformableSources()">Refresh Source Data</button>
        </div>
        <ui-select ng-if="transformableSources != null" ng-model="selected" on-select="selectTransformableSource($select.selected.name)">
            <ui-select-match placeholder="Select a Transformable Source...">{{$select.selected.name}}</ui-select-match>
            <ui-select-choices repeat="source in transformableSources | filter: {name: $select.search}">
                <div ng-bind-html="source.name | highlight: $select.search"></div>
            </ui-select-choices>
            <ui-select-no-choice>
                <b>No transformable sources found.</b>
            </ui-select-no-choice>
        </ui-select>
        <div ng-if="transformableSources == null" class="muted">
            No sources found. {{ isObsConfigured ? "Is OBS running?" : "Have you configured the OBS integration?" }}
        </div>
    </eos-container>
    <eos-container ng-if="transformableSources != null && effect.transformableSourceName != null" header="Transform" style="margin-top: 10px;" pad-top="true">
        <label class="control-fb control--checkbox">Animate </tooltip>
            <input type="checkbox" ng-model="effect.isAnimated" >
            <div class="control__indicator"></div>
        </label>
    </eos-container>
  `,
    optionsController: ($scope: any, backendCommunicator: any, $q: any) => {
        $scope.isObsConfigured = false;

        $scope.transformableSources = [];

        if ($scope.effect.transformableSource == null) {
            $scope.effect.transformableSource = "static";
        }

        $scope.selectTransformableSource = (transformableSourceName: string) => {
            $scope.effect.transformableSourceName = transformableSourceName;
        };

        $scope.toggleSource = () => {
            $scope.effect.transformableSource = $scope.effect.transformableSource === "static" ? "file" : "static";
        };

        $scope.textFileUpdated = (file: string) => {
            $scope.effect.file = file;
        };

        $scope.getTransformableSources = () => {
            $scope.isObsConfigured = backendCommunicator.fireEventSync("obs-is-configured");

            $q.when(
                backendCommunicator.fireEventAsync("obs-get-transformable-sources")
            ).then((transformableSources: OBSSource[]) => {
                $scope.transformableSources = transformableSources;
                $scope.selected = $scope.transformableSources?.find(source => source.name === $scope.effect.transformableSourceName);
            });
        };
        $scope.getTransformableSources();
    },
    optionsValidator: (effect) => {
        if (effect.transformableSourceName == null) {
            return ["Please select a text source."];
        }
        return [];
    },
    onTriggerEvent: async ({ effect }) => {
        await transformSourceScale(effect.transformableSourceName, 1000, 500, OBSTransformEaseMode.EaseIn);
        // await settransformableSourcesettings(effect.transformableSourceName, {
        //     text: effect.transformableSource === "static" ? effect.text : null,
        //     readFromFile: effect.transformableSource === "file",
        //     file: effect.transformableSource === "file" ? effect.file : null
        // });
        return true;
    }
};
