"use strict";

const channelAccess = require("../../common/channel-access");

const model = {
    definition: {
        id: "firebot:channelGame",
        name: "Channel Game",
        description: "Restricts use to when the game is a specific game.",
        triggers: []
    },
    optionsTemplate: `
    <div>
        <div id="gameTitle" class="mixplay-header" style="padding: 0 0 4px 0">
            Game Title
        </div>
        <div class="form-group">
            <input type="text" class="form-control" ng-model="restriction.title" placeholder="Enter game title exactly as it appears on Mixer.">
        </div>
    </div>
    `,
    optionsController: ($scope) => {
        if ($scope.restriction.title == null) {
            $scope.restriction.title = "";
        }
    },
    optionsValueDisplay: (restriction) => {
        let gameTitle = restriction.title;

        if (gameTitle == null) {
            gameTitle = "";
        }

        return `Game is ${gameTitle}.`;
    },
    /*
      function that resolves/rejects a promise based on if the restriction critera is met
    */
    predicate: (triggerData, restrictionData) => {
        return new Promise(async (resolve, reject) => {
            let channelData = await channelAccess.getStreamerGameData();
            if (channelData == null) {
                reject(`Can't determine the game being played.`);
            }

            let currentGameTitle = channelData.name;
            let gameTitle = restrictionData.title;

            let passed = false;

            if (gameTitle.toLowerCase() === currentGameTitle.toLowerCase()) {
                passed = true;
            }

            if (passed) {
                resolve();
            } else {
                reject(`Game must be set to ${gameTitle}.`);
            }
        });
    },
    onSuccessful: (triggerData, restrictionData) => {

    }

};

module.exports = model;