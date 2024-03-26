import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType } from "../../../../shared/variable-constants";

import variableManager from '../../replace-variable-manager';

// TODO: stub until macro manager is implemented
const macroManager = {
    getMacro(name: string) : null | string {
        return null;
    }
};

const model : ReplaceVariable = {
    definition: {
        handle: 'macro',
        description: 'calls a user-defined macro',
        hidden: true,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator(trigger: Trigger, name: string, ...macroArgs: unknown[]) {
        const macro = macroManager.getMacro(name);

        // nothing to do
        if (macro == null) {
            return null;
        }

        return variableManager.evaluateText(macro, { macroArgs }, trigger);
    }
};
export default model;