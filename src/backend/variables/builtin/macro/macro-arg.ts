import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: 'macroArg',
        description: 'gets the nth argument passed into the macro',
        hidden: true,
        possibleDataOutput: [OutputDataType.ALL]
    },
    evaluator(trigger: Trigger, argIndex: number | string) {
        if (argIndex == null || argIndex === '') {
            return;
        }

        const { macroArgs, macroArgNames } = <{ macroArgs: string[], macroArgNames: string[] }><unknown>trigger;
        const idxNum = Number(argIndex);

        if (Number.isInteger(idxNum) && idxNum > 0) {
            return macroArgs[idxNum - 1];
        }

        if (typeof argIndex === 'string' && macroArgNames != null) {
            const namedArgIdx = (macroArgNames).findIndex(item => item === argIndex);
            if (namedArgIdx > -1) {
                return macroArgs[namedArgIdx];
            }
        }
    }
};
export default model;