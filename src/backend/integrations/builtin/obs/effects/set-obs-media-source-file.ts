import { EffectType } from "../../../../../types/effects";
import { OBSSource, setMediaSourceSettings } from "../obs-remote";

export const SetOBSMediaSourceFileEffectType: EffectType<{
  mediaSourceName: string;
  file: string;
}> = {
  definition: {
    id: "firebot:obs-set-media-source-file",
    name: "Set OBS Media Source File",
    description: "Sets the file of an OBS media source",
    icon: "fad fa-film",
    categories: ["common"],
  },
  optionsTemplate: `
    <eos-container header="OBS Media Source">
        <div ng-if="mediaSources != null" class="btn-group" uib-dropdown>
            <button type="button" class="btn btn-default" uib-dropdown-toggle>
              {{effect.mediaSourceName}} <span class="caret"></span>
            </button>
            <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                <li role="menuitem" ng-repeat="mediaSource in mediaSources" ng-click="selectMediaSource(mediaSource.name)">
                    <a href>{{mediaSource.name}}</a>
                </li>
                <li role="menuitem" ng-show="mediaSources.length < 1" class="muted">
                    <a>No media sources found.</a>
                </li>
            </ul>
        </div>
        <div ng-if="mediaSources == null" class="muted">
            No sources found. Is OBS running?
        </div>
        <p>
            <button class="btn btn-link" ng-click="getMediaSources()">Refresh Source Data</button>
        </p>
    </eos-container>

    <eos-container ng-if="mediaSources != null && effect.mediaSourceName != null" header="File" style="margin-top: 10px;">
      <file-chooser model="effect.file" options="{ filters: [ {name: 'OBS-Supported Video Files', extensions: ['mp4', 'm4v', 'ts', 'mov', 'mxf', 'flv', 'mkv', 'avi', 'gif', 'webm']}, {name: 'OBS-Supported Audio Files', extensions: ['mp3', 'aac', 'ogg', 'wav']}, {name: 'All Files', extensions: ['*']} ]}"></file-chooser>
    </eos-container>
  `,
  optionsController: ($scope: any, backendCommunicator: any, $q: any) => {
    $scope.mediaSources = [];

    $scope.selectMediaSource = (mediaSourceName: string) => {
      $scope.effect.mediaSourceName = mediaSourceName;
    };

    $scope.getMediaSources = () => {
      $q.when(
        backendCommunicator.fireEventAsync("obs-get-media-sources")
      ).then((mediaSources: OBSSource[]) => {
        $scope.mediaSources = mediaSources ?? [];
      });
    };
    $scope.getMediaSources();
  },
  optionsValidator: (effect) => {
    const errors: string[] = [];

    if (effect.mediaSourceName == null) {
      errors.push("Please select a media source");
    } else if (!(effect.file?.length > 0)) {
      errors.push("Please select or enter a filename");
    }

    return errors;
  },
  onTriggerEvent: async ({ effect }) => {
    await setMediaSourceSettings(effect.mediaSourceName, {
      isLocalFile: true,
      localFile: effect.file
    });
    return true;
  },
};
