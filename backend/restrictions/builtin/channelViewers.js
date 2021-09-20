"use strict";

const twitchApi = require("../../twitch-api/api");

const accountAccess = require("../../common/account-access");
const logger = require("../../logwrapper");

const model = {
    definition: {
        id: "firebot:channelViewers",
        name: "Channel Viewer Count",
        description: "Restricts when channel has a certain number of current viewers.",
        triggers: []
    },
    optionsTemplate: `
    <div>
        <div id="numViewersOption" class="mixplay-header" style="padding: 0 0 4px 0">
            Comparison
        </div>
        <div>
            <select class="fb-select" ng-model="restriction.comparison">
                <option label="Less than (or equal to)" value="less">Less than (or equal to)</option>
                <option label="Greater than (or equal to)" value="greater">Greater than (or equal to)</option>
                <option label="Equal to" value="equal">Equal to</option>
            </select>
        </div>

        <div id="numberOfViewers" class="mixplay-header" style="padding: 0 0 4px 0">
            Amount
        </div>
        <div class="form-group">
            <input type="number" class="form-control" ng-model="restriction.amount" placeholder="Enter viewer count">
        </div>
    </div>
    `,
    optionsController: ($scope) => {
        if ($scope.restriction.amount == null) {
            $scope.restriction.amount = 0;
        }

        if ($scope.restriction.comparison == null) {
            $scope.restriction.comparison = "greater";
        }
    },
    optionsValueDisplay: (restriction) => {
        let comparison = restriction.comparison;
        let amount = restriction.amount;

        if (comparison != null) {
            comparison = comparison.toLowerCase();
        } else {
            return "";
        }

        if (comparison === "less") {
            comparison = "less than";
        } else if (comparison === "greater") {
            comparison = "greater than";
        } else if (comparison === "equal") {
            comparison = "equal to";
        }

        return "Viewers " + comparison + " " + amount;
    },
    /*
      function that resolves/rejects a promise based on if the restriction critera is met
    */
    predicate: (triggerData, restrictionData) => {
        return new Promise(async (resolve, reject) => {
            const client = twitchApi.getClient();
            const streamer = accountAccess.getAccounts().streamer;

            let currentViewers = null;
            try {
                const stream = await client.streams.getStreamByUserId(streamer.userId);
                currentViewers = stream.viewers;
            } catch (error) {
                logger.warn("unable to get stream viewer count", error);
            }

            if (currentViewers) {
                return reject(`Can't determine the current number of viewers.`);
            }

            let comparison = restrictionData.comparison;
            let numViewers = restrictionData.amount;
            let comparisonText = "";

            let passed = false;
            if (comparison === "less" && currentViewers <= numViewers) {
                passed = true;
            }

            if (comparison === "greater" && currentViewers >= numViewers) {
                passed = true;
            }

            if (comparison === "equal" && currentViewers === numViewers) {
                passed = true;
            }

            if (comparison === "greater" || comparison === "less") {
                comparisonText = `${comparison} than`;
            } else {
                comparisonText = `${comparison} to`;
            }

            if (passed) {
                resolve();
            } else {
                reject(`Viewer count must be ${comparisonText} ${numViewers}.`);
            }
        });
    },
    onSuccessful: (triggerData, restrictionData) => {

    }

};

module.exports = model;