"use strict";

const model = {
    definition: {
        id: "firebot:customvariable",
        name: "Custom Variable",
        description: "Restrict based on a custom variable set with the Custom Variable effect.",
        triggers: []
    },
    optionsTemplate: `
        <div>
            <div id="customVariableName" class="mixplay-header" style="padding: 0 0 4px 0">
                Custom Variable Name
            </div>
            <div class="form-group">
                <input class="fb-control fb-select" style="color:black; padding-left: .3em" type="text" ng-model="restriction.name">
            </div>
            <div id="customVariableName" class="mixplay-header" style="padding: 0 0 4px 0">
                Value
            </div>
            <div class="form-group">
                <input class="fb-control fb-select" style="color:black; padding-left: .3em" type="text" ng-model="restriction.value">
            </div>
        </div>
    `,
    optionsController: ($scope) => {

    },
    optionsValueDisplay: (restriction) => {
        let name = restriction.name;
        let value = restriction.value;

        if (name == null || value == null) {
            return "";
        }

        return name + " is " + value;
    },
    /*
      function that resolves/rejects a promise based on if the restriction critera is met
    */
    predicate: (triggerData, restrictionData) => {
        return new Promise(async (resolve, reject) => {
            let customVariableManager = require("../../common/custom-variable-manager");

            let passed = false;
            let cachedVariable = customVariableManager.getCustomVariable(restrictionData.name);

            // eslint-disable-next-line eqeqeq
            if (cachedVariable !== null && cachedVariable == restrictionData.value) {
                passed = true;
            }

            if (passed) {
                resolve();
            } else {
                reject("A flag is not set to the correct value.");
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