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
            <div id="userFollowList" class="mixplay-header" style="padding: 0 0 4px 0">
                User follows
            </div>
            <input type="text" class="form-control" placeholder="Enter value" ng-model="restriction.value">
        </div>
    `,
    optionsController: ($scope) => {

    },
    optionsValueDisplay: (restriction) => {
        let value = restriction.value;

        if (value == null) {
            return "";
        }

        return value;
    },
    /*
      function that resolves/rejects a promise based on if the restriction critera is met
    */
    predicate: async (trigger, restrictionData) => {
        return new Promise(async (resolve, reject) => {
            const userAccess = require("../../common/user-access");
            let triggerUserId = trigger.metadata.userId ? trigger.metadata.userId : "";
            let normalizeFollowList = restrictionData.value ? restrictionData.value.toLowerCase() : "";

            if (normalizeFollowList === "" || triggerUserId === "") {
                return reject("You are not following the correct people to use this.");
            }

            let followCheckList = normalizeFollowList.replace(new RegExp(' ', 'g'), "").split(',');
            let followCheck = await userAccess.userFollowsUsers(triggerUserId, followCheckList);

            if (followCheck) {
                return resolve();
            }

            return reject("You must be following: " + restrictionData.value);
        });
    },
    /*
        called after all restrictions in a list are met. Do logic such as deducting currency here.
    */
    onSuccessful: (triggerData, restrictionData) => {

    }

};

module.exports = model;