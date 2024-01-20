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
    optionsValueDisplay: (restriction) => {
        const time = restriction.time || 0;

        return `${time}+ min(s)`;
    },
    /*
      function that resolves/rejects a promise based on if the restriction criteria is met
    */
    predicate: (triggerData, restrictionData) => {
        return new Promise(async (resolve, reject) => {
            let passed = false;
            const viewerDatabase = require('../../viewers/viewer-database');
            const viewer = await viewerDatabase.getViewerByUsername(triggerData.metadata.username);
            const viewtime = viewer.minutesInChannel;

            if (viewtime >= restrictionData.time) {
                passed = true;
            }

            if (passed) {
                resolve();
            } else {
                reject("You have not spent enough time in the channel to use this");
            }
        });
    }
};

module.exports = model;