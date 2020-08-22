"use strict";

const model = {
    definition: {
        id: "firebot:mixplayInteractions",
        name: "Mixplay Interactions",
        description: "Restricts to users who have used mixplay a certain number of times.",
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

    },
    optionsValueDisplay: (restriction) => {
        let interactions = restriction.interactions || 0;

        return interactions + "+";
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