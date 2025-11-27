/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */

import type { RestrictionType } from "../../../types/restrictions";
import { TwitchApi } from "../../streaming-platforms/twitch/api";
import { AccountAccess } from "../../common/account-access";
import logger from "../../logwrapper";

type ComparisonType = "less" | "greater" | "equal";

const model: RestrictionType<{
    comparison: ComparisonType;
    amount: number;
}> = {
    definition: {
        id: "firebot:channelViewers",
        name: "Channel Viewer Count",
        description: "Restricts when channel has a certain number of current viewers.",
        triggers: []
    },
    optionsTemplate: `
    <div>
        <div id="numViewersOption" class="modal-subheader" style="padding: 0 0 4px 0">
            Comparison
        </div>
        <div>
            <select class="fb-select" ng-model="restriction.comparison">
                <option label="Less than (or equal to)" value="less">Less than (or equal to)</option>
                <option label="Greater than (or equal to)" value="greater">Greater than (or equal to)</option>
                <option label="Equal to" value="equal">Equal to</option>
            </select>
        </div>

        <div id="numberOfViewers" class="modal-subheader" style="padding: 0 0 4px 0">
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
        const amount = restriction.amount;

        if (comparison != null) {
            comparison = comparison.toLowerCase() as ComparisonType;
        } else {
            return "";
        }

        let comparisionString: string;

        if (comparison === "less") {
            comparisionString = "less than";
        } else if (comparison === "greater") {
            comparisionString = "greater than";
        } else if (comparison === "equal") {
            comparisionString = "equal to";
        }

        return `Viewers ${comparisionString} ${amount}`;
    },
    /*
      function that resolves/rejects a promise based on if the restriction criteria is met
    */
    predicate: (triggerData, restrictionData) => {
        return new Promise(async (resolve, reject) => {
            const client = TwitchApi.streamerClient;
            const streamer = AccountAccess.getAccounts().streamer;

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

            const comparison = restrictionData.comparison;
            const numViewers = restrictionData.amount;
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
                resolve(true);
            } else {
                reject(`Viewer count must be ${comparisonText} ${numViewers}.`);
            }
        });
    }
};

export = model;