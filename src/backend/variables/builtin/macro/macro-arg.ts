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
        if (argIndex == null || argIndex === '') {
            return;
        }

        const { macroArgs, macroNamedArgs } = trigger.metadata;
        const idxNum = Number(argIndex);

        if (Number.isInteger(idxNum) && idxNum > 0) {
            return macroArgs[idxNum - 1];
        }


        if (typeof argIndex === 'string' && macroNamedArgs != null) {
            const namedArgIdx = (<string[]>macroNamedArgs).findIndex(item => item === argIndex);
            if (namedArgIdx > -1) {
                return macroArgs[namedArgIdx];
            }
        }
    }
};
export default model;