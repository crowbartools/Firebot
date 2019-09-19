"use strict";

const model = {
    definition: {
        id: "firebot:permissions",
        name: "Permissions",
        triggers: []
    },
    optionsTemplate: "<div></div>",
    optionsController: (viewerRolesService) => {},
    optionsValueDisplay: (model) => {
        return "";
    },
    predicate: (triggerData) => {

    }
};

module.exports = model;