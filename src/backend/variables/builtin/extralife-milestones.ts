import { ReplaceVariable } from "../../../types/variables";
import { EffectTrigger } from "../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../shared/variable-constants";
const { getParticipantIncentives } = require('extra-life-ts');

const ExtraLifeMilestones: ReplaceVariable = {
    definition: {
        handle: "extraLifeMilestones",
        description: "Returns information on extra life milestones. See examples for details.",
        examples: [
            {
                usage: 'extraLifeMilestones[participantID, 1]',
                description: "Returns one milestone."
            },
        ],
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, participantID: number, numResults: number, sortName: string, returnJson: boolean) => {
        return getParticipantIncentives(participantID, { limit: numResults }).then((result) => {
            result = result.data;
            console.log(result);

            if (returnJson) {
                return JSON.stringify(result);
            }
        });
    }
};

export = ExtraLifeMilestones;