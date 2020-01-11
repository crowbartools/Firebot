"use strict";

const model = {
    definition: {
        id: "firebot:mixplayInteractions",
        name: "Mixplay Interactions",
        description: "Restricts to users who have used mixplay a certain number of times.",
        triggers: []
    },
    optionsTemplate: `
        <div>
            <div id="mixplayRestriction" class="mixplay-header" style="padding: 0 0 4px 0">
                Mixplay Interactions (# of interactions)
            </div>
            <div class="form-group">
                <input class="fb-control fb-select" style="color:black; padding-left: .3em" type="number" placeholder="0" ng-model="restriction.interactions">
            </div>
        </div>
    `,
    optionsController: ($scope) => {

    },
    optionsValueDisplay: (restriction) => {
        let interactions = restriction.interactions;

        if (interactions == null) {
            return "";
        }

        return "Mixplay interactons: " + interactions + "+";
    },
    /*
      function that resolves/rejects a promise based on if the restriction critera is met
    */
    predicate: (triggerData, restrictionData) => {
        return new Promise(async (resolve, reject) => {
            let passed = false;
            const viewerDB = require('../../database/userDatabase');
            let viewer = await viewerDB.getUserByUsername(triggerData.metadata.username);
            let interactions = viewer.mixplayInteractions;

            if (interactions >= restrictionData.interactions) {
                passed = true;
            }

            if (passed) {
                resolve();
            } else {
                reject("You have not used Mixplay enough on this channel");
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