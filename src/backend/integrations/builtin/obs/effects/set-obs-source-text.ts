import { EffectType } from "../../../../effects/models/effect-models";
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
    categories: ["common"],
  },
  optionsTemplate: `
    <eos-container header="OBS Text Source">
        <div ng-if="textSources != null" class="btn-group" uib-dropdown>
            <button type="button" class="btn btn-default" uib-dropdown-toggle>
              {{effect.textSourceName}} <span class="caret"></span>
            </button>
            <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                <li role="menuitem" ng-repeat="textSource in textSources" ng-click="selectTextSource(textSource.name)">
                    <a href>{{textSource.name}}</a>
                </li>
                <li role="menuitem" ng-show="textSources.length < 1" class="muted">
                    <a>No text sources found.</a>
                </li>
            </ul>
        </div>
        <div ng-if="textSources == null" class="muted">
            No sources found. Is OBS running?
        </div>
        <p>
            <button class="btn btn-link" ng-click="getTextSources()">Refresh Source Data</button>
        </p>
    </eos-container>
    <eos-container ng-if="textSources != null && effect.textSourceName != null" header="Text" style="margin-top: 10px;">
        <label  class="control-fb control--checkbox">Use file as text source
            <input type="checkbox" ng-click="toggleSource()" ng-checked="effect.textSource === 'file'"  aria-label="..." >
            <div class="control__indicator"></div>
        </label>
        <firebot-input ng-if="effect.textSource === 'static'" model="effect.text" use-text-area="true"></firebot-input>
        <file-chooser ng-if="effect.textSource === 'file'" model="effect.file" options="{ filters: [ {name: 'Text File', extensions: ['txt']}, {name: 'All Files', extensions: ['*']} ]}" on-update="textFileUpdated(filepath)"></file-chooser>
    </eos-container>
  `,
  optionsController: ($scope: any, backendCommunicator: any, $q: any) => {
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
      $q.when(
        backendCommunicator.fireEventAsync("obs-get-text-sources")
      ).then((textSources: OBSSource[]) => {
        $scope.textSources = textSources ?? [];
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
  onTriggerEvent: async ({ effect }) => {
    await setTextSourceSettings(effect.textSourceName, {
      text: effect.textSource === "static" ? effect.text : null,
      readFromFile: effect.textSource === "file",
      file: effect.textSource === "file" ? effect.file : null
    });
    return true;
  },
};
