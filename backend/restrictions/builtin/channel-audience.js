"use strict";

const channelAccess = require("../../common/channel-access");
const { ResolvedKeybinding } = require("custom-electron-titlebar/lib/common/keyCodes");

const model = {
    definition: {
        id: "firebot:channel-audience",
        name: "Channel Audience",
        description: "Restricts based on the current channel audience (Family/Teen/18+).",
        hidden: true,
        triggers: []
    },
    optionsTemplate: `
        <div>
            <div class="alert alert-danger">
                This restriction only worked on Mixer. It now does nothing and can be removed.
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
            resolve();
        });
    },
    /*
        called after all restrictions in a list are met. Do logic such as deducting currency here.
    */
    onSuccessful: (triggerData, restrictionData) => {

    }

};

module.exports = model;