import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import integrationManager from "../../../../integrations/integration-manager";
const { getParticipantMilestones, getParticipant } = require('extra-life-ts');

const ExtraLifeMilestones: ReplaceVariable = {
    definition: {
        handle: "extraLifeMilestones",
        description: "Returns information on extra life milestones. See examples for details.",
        examples: [
            {
                usage: 'extraLifeMilestones[]',
                description: "Returns the next milestone for the logged in extra life account."
            },
            {
                usage: 'extraLifeMilestones[null, 1, participantID]',
                description: "Returns the next milestone for the given participant id."
            },
            {
                usage: 'extraLifeMilestones[75, 1, participantID]',
                description: "Returns a milestone with the goal of $75 for the given participant id."
            },
            {
                usage: 'extraLifeMilestones[75]',
                description: "Returns a milestone with the goal of $75 for the logged in extra life account."
            },
            {
                usage: 'extraLifeMilestones[null, 3, participantID, true]',
                description: "Returns three milestones in JSON format."
            }
        ],
        categories: [VariableCategory.COMMON, VariableCategory.INTEGRATION],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_, milestoneGoal: string, numResults: number, participantID: number, returnJson: boolean) => {
        if (numResults == null) {
            numResults = 1;
        }

        if (participantID == null) {
            participantID = integrationManager.getIntegrationAccountId("extralife");
        }

        if (milestoneGoal.trim() === '') {
            milestoneGoal = null;
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
        extraLifeCall.forEach((milestone) => {
            milestoneString += `$${milestone.fundraisingGoal} - ${milestone.description}. `;
        });

        return milestoneString.trim();
    }
};

export = ExtraLifeMilestones;