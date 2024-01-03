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
            <div id="customVariableName" class="modal-subheader" style="padding: 0 0 4px 0">
                Custom Variable Name
            </div>
            <input type="text" class="form-control" placeholder="Enter name" ng-model="restriction.name">

            <div id="customVariableName" class="modal-subheader" style="padding: 0 0 4px 0">
                Value
            </div>
            <input type="text" class="form-control" placeholder="Enter value" ng-model="restriction.value">
        </div>
    `,
    optionsValueDisplay: (restriction) => {
        const name = restriction.name;
        const value = restriction.value;

        if (name == null || value == null) {
            return "";
        }

        return `${name} is ${value}`;
    },
    /*
      function that resolves/rejects a promise based on if the restriction criteria is met
    */
    predicate: (_, restrictionData) => {
        return new Promise(async (resolve, reject) => {
            const customVariableManager = require("../../common/custom-variable-manager");

            let passed = false;
            const cachedVariable = customVariableManager.getCustomVariable(restrictionData.name);

            let value = restrictionData.value;
            try {
                value = JSON.parse(value);
            } catch (error) {
                //fail silently
            }

            // eslint-disable-next-line eqeqeq
            if (cachedVariable == value) {
                passed = true;
            }

            if (passed) {
                resolve();
            } else {
                reject("A flag is not set to the correct value");
            }
        });
    }
};

module.exports = model;