import { EffectType } from "../../../../../types/effects";
import { OBSSource, setTextSourceSettings } from "../obs-remote";

export const SetOBSSourceTextEffectType: EffectType<{
    textSourceName: string;
    textSource: "static" | "file";
    text: string;
    file: string;
}> = {
    definition: {
        id: "firebot:obs-set-source-text",
        name: "Set OBS Source Text",
        description: "Sets the text in an OBS text source",
        icon: "fad fa-font-case",
        categories: ["common"]
    },
    optionsTemplate: `
    <eos-container header="OBS Text Source">
        <div>
            <button class="btn btn-link" ng-click="getTextSources()">Refresh Source Data</button>
        </div>
        <ui-select ng-if="textSources != null" ng-model="selected" on-select="selectTextSource($select.selected.name)">
            <ui-select-match placeholder="Select a Text Source...">{{$select.selected.name}}</ui-select-match>
            <ui-select-choices repeat="source in textSources | filter: {name: $select.search}">
                <div ng-bind-html="source.name | highlight: $select.search"></div>
            </ui-select-choices>
            <ui-select-no-choice>
                <b>No text sources found.</b>
            </ui-select-no-choice>
        </ui-select>
        <div ng-if="textSources == null" class="muted">
            No sources found. {{ isObsConfigured ? "Is OBS running?" : "Have you configured the OBS integration?" }}
        </div>
    </eos-container>
    <eos-container ng-if="textSources != null && effect.textSourceName != null" header="Text" style="margin-top: 10px;" pad-top="true">
        <label class="control-fb control--checkbox">Use file as text source
            <input type="checkbox" ng-click="toggleSource()" ng-checked="effect.textSource === 'file'"  aria-label="..." >
            <div class="control__indicator"></div>
        </label>
        <firebot-input ng-if="effect.textSource === 'static'" model="effect.text" use-text-area="true"></firebot-input>
        <file-chooser ng-if="effect.textSource === 'file'" model="effect.file" options="{ filters: [ {name: 'Text File', extensions: ['txt']}, {name: 'All Files', extensions: ['*']} ]}" on-update="textFileUpdated(filepath)"></file-chooser>
    </eos-container>
  `,
    optionsController: ($scope: any, backendCommunicator: any, $q: any) => {
        $scope.isObsConfigured = false;

        $scope.textSources = [];

        if ($scope.effect.textSource == null) {
            $scope.effect.textSource = "static";
        }

        $scope.selectTextSource = (textSourceName: string) => {
            $scope.effect.textSourceName = textSourceName;
        };

        $scope.toggleSource = () => {
            $scope.effect.textSource = $scope.effect.textSource === "static" ? "file" : "static";
        };

        $scope.textFileUpdated = (file: string) => {
            $scope.effect.file = file;
        };

        $scope.getTextSources = () => {
            $scope.isObsConfigured = backendCommunicator.fireEventSync("obs-is-configured");

            $q.when(
                backendCommunicator.fireEventAsync("obs-get-text-sources")
            ).then((textSources: OBSSource[]) => {
                $scope.textSources = textSources;
                $scope.selected = $scope.textSources?.find(source => source.name === $scope.effect.textSourceName);
            });
        };
        $scope.getTextSources();
    },
    optionsValidator: (effect) => {
        if (effect.textSourceName == null) {
            return ["Please select a text source."];
        }
        return [];
    },
    getDefaultLabel: (effect) => {
        return effect.textSourceName;
    },
    onTriggerEvent: async ({ effect }) => {
        await setTextSourceSettings(effect.textSourceName, {
            text: effect.textSource === "static" ? effect.text : null,
            readFromFile: effect.textSource === "file",
            file: effect.textSource === "file" ? effect.file : null
        });
        return true;
    }
};
