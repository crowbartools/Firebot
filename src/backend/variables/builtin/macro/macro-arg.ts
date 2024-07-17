import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: 'macroArgs',
        description: 'gets the nth argument passed into the macro',
        hidden: true,
        possibleDataOutput: [OutputDataType.ALL]
    },
    evaluator(trigger: Trigger, argIndex: number | string) {
        let idx = Number(argIndex);
        if (!Number.isInteger(idx) || idx < 0) {
            return;
        }

        const macroArgs = trigger.metadata.macroArgs;
        if (!macroArgs) {
            return;
        }
        return macroArgs[idx];
    }
};
export default model;