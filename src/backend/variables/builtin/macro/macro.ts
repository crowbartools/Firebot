import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType } from "../../../../shared/variable-constants";

import macroManager from '../../macro-manager';

import variableManager from '../../replace-variable-manager';

const model : ReplaceVariable = {
    definition: {
        handle: 'macro',
        description: 'calls a user-defined macro',
        hidden: true,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator(trigger: Trigger, name: string, ...macroArgs: unknown[]) {
        const macro = macroManager.getMacroByName(name);

        // nothing to do
        if (macro == null) {
            return null;
        }

        return variableManager.evaluateText(macro.expression, { macroArgs }, trigger);
    }
};
export default model;