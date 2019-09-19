"use strict";

const model = {
    definition: {
        id: "firebot:permissions",
        name: "Permissions",
        description: "Restrict based on viewer name or roles.",
        triggers: []
    },
    optionsTemplate: "<div></div>",
    optionsController: (viewerRolesService) => {},
    optionsValueDisplay: (model) => {
        return "";
    },
    /*
      function that resolves/rejects a promise based on if the restriction critera is met
    */
    predicate: (triggerData, restrictionData) => {

    },
    /*
        called after all restrictions in a list are met. Do logic such as deducting currency here.
    */
    onSuccessful: (triggerData, restrictionData) => {

    }

};

module.exports = model;