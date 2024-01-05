"use strict";

const model = {
    definition: {
        id: "firebot:followcheck",
        name: "Follow Check",
        description: "Restrict based on if user is following everyone in a comma separated list.",
        triggers: []
    },
    optionsTemplate: `
        <div>
            <div id="userFollowList" class="modal-subheader" style="padding: 0 0 4px 0">
                User follows
            </div>
            <input type="text" class="form-control" placeholder="Enter value" ng-model="restriction.value">
        </div>
    `,
    optionsValueDisplay: (restriction) => {
        const value = restriction.value;

        if (value == null) {
            return "";
        }

        return value;
    },
    /*
      function that resolves/rejects a promise based on if the restriction criteria is met
    */
    predicate: async (trigger, restrictionData) => {
        return new Promise(async (resolve, reject) => {
            const userAccess = require("../../common/user-access");

            const triggerUsername = trigger.metadata.username || "";
            const followListString = restrictionData.value || "";

            if (triggerUsername === "", followListString === "") {
                return resolve();
            }

            const followCheckList = followListString.split(',')
                .filter(f => f != null)
                .map(f => f.toLowerCase().trim());

            const followCheck = await userAccess.userFollowsChannels(triggerUsername, followCheckList);

            if (followCheck) {
                return resolve();
            }

            return reject(`You must be following: ${restrictionData.value}`);
        });
    }
};

module.exports = model;