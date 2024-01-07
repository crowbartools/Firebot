import { ReplaceVariable } from "../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../shared/variable-constants";
const { getParticipantIncentives } = require('extra-life-ts');

const ExtraLifeIncentives: ReplaceVariable = {
    definition: {
        handle: "extraLifeIncentives",
        description: "Returns information on extra life incentives. See examples for details.",
        examples: [
            {
                usage: 'extraLifeIncentives[participantID, 1, Play one handed]',
                description: "Returns one incentive with the description 'Play one handed'."
            },
            {
                usage: 'extraLifeIncentives[participantID, 3]',
                description: "Returns three active incentives."
            },
            {
                usage: 'extraLifeIncentives[participantID, 10, null, true]',
                description: "Returns ten active incentives as JSON."
            }
        ],
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_, participantID: number, numResults: number, rewardDesc: string, returnJson: boolean) => {
        if (numResults == null) {
            numResults = 1;
        }

        let extraLifeCall = await getParticipantIncentives(participantID, {orderBy: 'amount ASC'}).then((result) => {
            result = result.data;

            if (rewardDesc != null) {
                result = result.filter(function (incentive) {
                    return incentive.description === rewardDesc.trim();
                });
            }

            return result;
        });

        extraLifeCall = extraLifeCall.slice(0, numResults);

        if (returnJson) {
            return JSON.stringify(extraLifeCall);
        }

        let incentiveString = "";
        extraLifeCall.forEach(incentive => {
            incentiveString += `$${incentive.amount} - ${incentive.description} (${incentive.quantity - incentive.quantityClaimed} / ${incentive.quantity}). `;
        });

        return incentiveString.trim();
    }
};

export = ExtraLifeIncentives;