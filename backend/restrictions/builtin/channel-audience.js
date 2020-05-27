"use strict";

const channelAccess = require("../../common/channel-access");

const model = {
    definition: {
        id: "firebot:channel-audience",
        name: "Channel Audience",
        description: "Restricts based on the current channel audience (Family/Teen/18+).",
        triggers: []
    },
    optionsTemplate: `
        <div>
            <div id="channelAudience" class="mixplay-header" style="padding: 0 0 4px 0">
                Audience Type
            </div>
            <div>
                <select class="fb-select" ng-model="restriction.audience">    
                    <option label="Family Friendly" value="family">Family Friendly</option>
                    <option label="Teen" value="teen">Teen</option>
                    <option label="18+" value="18+">18+</option>
                </select>
            </div>
        </div>
    `,
    optionsController: ($scope) => {
        if ($scope.restriction.audience == null) {
            $scope.restriction.audience = "18+";
        }
    },
    optionsValueDisplay: (restriction) => {
        let audience = restriction.audience;
        if (audience === "family") {
            return "Family Friendly";
        }
        if (audience === "teen") {
            return "Teen";
        }
        if (audience === "18+") {
            return "18+";
        }
        return "18+";
    },
    /*
      function that resolves/rejects a promise based on if the restriction critera is met
    */
    predicate: (_, restrictionData) => {
        return new Promise(async (resolve, reject) => {
            let passed = false;

            if (restrictionData.audience == null) {
                restrictionData.audience = "18+";
            }

            let channelAudience = await channelAccess.getStreamerAudience();
            if (channelAudience == null || restrictionData.audience === channelAudience) {
                passed = true;
            }

            if (passed) {
                resolve();
            } else {
                reject("Channel is not set to the required audience level.");
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