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
    evaluator: (_, participantID: number, numResults: number, rewardDesc: string, returnJson: boolean) => {
        const filter = {
            limit: numResults,
            where: {
                fieldName: 'isActive',
                operator: '=',
                term: true
            }
        };

        if (rewardDesc != null) {
            filter.where = {
                fieldName: 'description',
                operator: '=',
                // @ts-ignore: term can be string or bool according to docs. Type error here.
                term: rewardDesc
            };
        }

        return getParticipantIncentives(participantID, filter).then((result) => {
            result = result.data;

            if (returnJson) {
                return JSON.stringify(result);
            }

            let incentiveString = "";
            result.forEach(incentive => {
                incentiveString += `$${incentive.amount} - ${incentive.description} (${incentive.quantity - incentive.quantityClaimed} / ${incentive.quantity}). `;
            });

            return incentiveString.trim();
        });
    }
};

export = ExtraLifeIncentives;