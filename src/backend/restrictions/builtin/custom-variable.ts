import type { RestrictionType } from "../../../types";
import { CustomVariableManager } from "../../common/custom-variable-manager";

const model: RestrictionType<{
    name: string;
    value: string;
}> = {
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
    predicate: (_, { name, value }) => {
        let passed = false;
        const cachedVariable = CustomVariableManager.getCustomVariable(name);

        try {
            value = JSON.parse(value);
        } catch {
            //fail silently
        }

        // eslint-disable-next-line eqeqeq
        if (cachedVariable == value) {
            passed = true;
        }

        return {
            success: passed,
            failureReason: passed !== true
                ? "A flag is not set to the correct value"
                : undefined
        };
    }
};

export = model;