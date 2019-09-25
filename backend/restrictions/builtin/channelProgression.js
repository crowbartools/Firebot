"use strict";

const channelAccess = require("../../common/channel-access");

const model = {
    definition: {
        id: "firebot:channelprogression",
        name: "Channel Progression",
        description: "Restrict based on Channel Progression rank.",
        triggers: []
    },
    optionsTemplate: `
        <div>
            <div id="minimumRank" class="mixplay-header" style="padding: 0 0 4px 0">
                MINIMUM RANK
            </div>
            <input type="number" class="form-control" aria-describedby="minimumRank" ng-model="restriction.minimumRank" placeholder="Enter minimum rank" min="0" max="99">  
        </div>
    `,
    optionsController: ($scope) => {
        if (!$scope.restriction.minimumRank === undefined) {
            $scope.restriction.minimumRank = 0;
        }
    },
    optionsValueDisplay: (restriction) => {
        let level = restriction.minimumRank || 0;
        return `Lvl ${level}+`;
    },
    /*
      function that resolves/rejects a promise based on if the restriction critera is met
    */
    predicate: (triggerData, restrictionData) => {
        return new Promise(async (resolve, reject) => {

            let level = 0;
            if (triggerData.type === "command") {
                level = triggerData.metadata.chatEvent.user_ascension_level;
            } else {
                let username = triggerData.username;

                let progressionData = await channelAccess.getChannelProgressionByUsername(username);
                level = progressionData.level;
            }

            let passed = level >= restrictionData.minimumRank;

            if (passed) {
                resolve();
            } else {
                reject("You don't meet the minimum channel progression rank.");
            }
        });
    },
    /*
        called after all restrictions in a list are met. Do logic such as deducting currency here.
    */
    onSuccessful: (triggerData, restrictionData) => {

    }

};

module.exports = model;