"use strict";

const model = {
    definition: {
        id: "firebot:viewTime",
        name: "View Time",
        description: "Restricts to users who have been in the stream for X minutes.",
        triggers: []
    },
    optionsTemplate: `
        <div>
            <div id="viewTimeRestriction" class="modal-subheader" style="padding: 0 0 4px 0">
                View Time Minimum
            </div>
            <input type="number" class="form-control" placeholder="Enter minutes" ng-model="restriction.time">
        </div>
    `,
    optionsController: ($scope) => {

    },
    optionsValueDisplay: (restriction) => {
        let time = restriction.time || 0;

        return time + "+ min(s)";
    },
    /*
      function that resolves/rejects a promise based on if the restriction critera is met
    */
    predicate: (triggerData, restrictionData) => {
        return new Promise(async (resolve, reject) => {
            let passed = false;
            const viewerDB = require('../../database/userDatabase');
            let viewer = await viewerDB.getUserByUsername(triggerData.metadata.username);
            let viewtime = viewer.minutesInChannel;

            if (viewtime >= restrictionData.time) {
                passed = true;
            }

            if (passed) {
                resolve();
            } else {
                reject("You have not spent enough time in the channel to use this");
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