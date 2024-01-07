import { ReplaceVariable } from "../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../shared/variable-constants";
const { getParticipantMilestones, getParticipant } = require('extra-life-ts');

const ExtraLifeMilestones: ReplaceVariable = {
    definition: {
        handle: "extraLifeMilestones",
        description: "Returns information on extra life milestones. See examples for details.",
        examples: [
            {
                usage: 'extraLifeMilestones[participantID, 1]',
                description: "Returns the next milestone."
            },
            {
                usage: 'extraLifeMilestones[participantID, 1, 75]',
                description: "Returns a milestone with the goal of $75."
            },
            {
                usage: 'extraLifeMilestones[participantID, 3, null, true]',
                description: "Returns three milestones in JSON format."
            }
        ],
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_, participantID: number, numResults: number, milestoneGoal: string, returnJson: boolean) => {
        if (numResults == null) {
            numResults = 1;
        }

        const currentDonations = await getParticipant(participantID).then((result) => {
            result = result.data;
            if (result) {
                return result.sumDonations;
            }

            return 0;
        });

        let extraLifeCall = await getParticipantMilestones(participantID, {orderBy: 'fundraisingGoal ASC'}).then((result) => {
            result = result.data;

            if (milestoneGoal != null) {
                result = result.filter(function (milestone) {
                    return milestone.fundraisingGoal === parseInt(milestoneGoal);
                });
            } else {
                result = result.filter(function (milestone) {
                    return milestone.fundraisingGoal >= currentDonations;
                });
            }

            return result;
        });

        extraLifeCall = extraLifeCall.slice(0, numResults);

        if (returnJson) {
            return JSON.stringify(extraLifeCall);
        }

        let milestoneString = "";
        extraLifeCall.forEach(milestone => {
            milestoneString += `$${milestone.fundraisingGoal} - ${milestone.description}. `;
        });

        return milestoneString.trim();
    }
};

export = ExtraLifeMilestones;