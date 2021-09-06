"use strict";

const model = {
    definition: {
        id: "firebot:channelprogression",
        name: "Channel Progression",
        description: "Restrict based on Channel Progression rank.",
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