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
        if (macro == null) {
            return null;
        }
        const { argNames: macroArgNames } = macro;
        return variableManager.evaluateText(macro.expression, { macroArgs, macroArgNames }, trigger);
    }
};
export default model;