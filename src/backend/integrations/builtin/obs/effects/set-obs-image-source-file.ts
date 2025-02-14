import { EffectType } from "../../../../../types/effects";
import { OBSSource, setImageSourceSettings } from "../obs-remote";

export const SetOBSImageSourceFileEffectType: EffectType<{
    imageSourceName: string;
    file: string;
}> = {
    definition: {
        id: "firebot:obs-set-image-source-file",
        name: "Set OBS Image Source File",
        description: "Sets the file of an OBS image source",
        icon: "fad fa-photo-video",
        categories: ["common"]
    },
    optionsTemplate: `
    <eos-container header="OBS Image Source">
        <div>
            <button class="btn btn-link" ng-click="getImageSources()">Refresh Source Data</button>
        </div>

        <ui-select ng-if="imageSources != null" ng-model="selected" on-select="selectImageSource($select.selected.name)">
            <ui-select-match placeholder="Select an Image Source...">{{$select.selected.name}}</ui-select-match>
            <ui-select-choices repeat="source in imageSources | filter: {name: $select.search}">
                <div ng-bind-html="source.name | highlight: $select.search"></div>
            </ui-select-choices>
            <ui-select-no-choice>
                <b>No image sources found.</b>
            </ui-select-no-choice>
        </ui-select>

        <div ng-if="imageSources == null" class="muted">
            No sources found. {{ isObsConfigured ? "Is OBS running?" : "Have you configured the OBS integration?" }}
        </div>
    </eos-container>

    <eos-container ng-if="imageSources != null && effect.imageSourceName != null" header="File" style="margin-top: 10px;" pad-top="true">
        <file-chooser model="effect.file" options="{ filters: [ {name: 'OBS-Supported Image Files', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tga', 'jxr', 'psd', 'webp']}, {name: 'All Files', extensions: ['*']} ]}"></file-chooser>
    </eos-container>
  `,
    optionsController: ($scope: any, backendCommunicator: any, $q: any) => {
        $scope.isObsConfigured = false;

        $scope.imageSources = [];

        $scope.selectImageSource = (imageSourceName: string) => {
            $scope.effect.imageSourceName = imageSourceName;
        };

        $scope.getImageSources = () => {
            $scope.isObsConfigured = backendCommunicator.fireEventSync("obs-is-configured");

            $q.when(
                backendCommunicator.fireEventAsync("obs-get-image-sources")
            ).then((imageSources: OBSSource[]) => {
                $scope.imageSources = imageSources;
                $scope.selected = $scope.imageSources?.find(source => source.name === $scope.effect.imageSourceName);
            });
        };
        $scope.getImageSources();
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];

        if (effect.imageSourceName == null) {
            errors.push("Please select an image source");
        } else if (!(effect.file?.length > 0)) {
            errors.push("Please select or enter a filename");
        }

        return errors;
    },
    getDefaultLabel: (effect) => {
        return effect.imageSourceName;
    },
    onTriggerEvent: async ({ effect }) => {
        await setImageSourceSettings(effect.imageSourceName, {
            file: effect.file
        });
        return true;
    }
};
