import { getParticipantIncentives } from 'extra-life-ts';
import { ReplaceVariable } from "../../../../../types/variables";
import integrationManager from "../../../../integrations/integration-manager";

const ExtraLifeIncentives: ReplaceVariable = {
    definition: {
        handle: "extraLifeIncentives",
        description: "Returns information on extra life incentives. See examples for details.",
        examples: [
            {
                usage: 'extraLifeIncentives[]',
                description: "Returns one incentive for the logged in extra life account."
            },
            {
                usage: 'extraLifeIncentives[Play one handed]',
                description: "Returns one incentive with the description 'Play one handed' for the logged in extra life account."
            },
            {
                usage: 'extraLifeIncentives[Play one handed, 1, participantID]',
                description: "Returns one incentive with the description 'Play one handed' for the given participant id."
            },
            {
                usage: 'extraLifeIncentives[null, 3, participantID]',
                description: "Returns three incentives for given participant ID."
            },
            {
                usage: 'extraLifeIncentives[null, 10, null, true]',
                description: "Returns ten incentives for current logged in extra life account in JSON format."
            }
        ],
        categories: ["common", "integrations"],
        possibleDataOutput: ["text"]
    },
    evaluator: async (_, rewardDesc: string, numResults: number, participantID: number, returnJson: boolean) => {
        if (numResults == null) {
            numResults = 1;
        }

        if (participantID == null) {
            participantID = integrationManager.getIntegrationAccountId("extralife");
        }

        if (rewardDesc == null || rewardDesc.trim() === '') {
            rewardDesc = null;
        }

        let extraLifeCall = await getParticipantIncentives(participantID, { orderBy: 'amount ASC' }).then(({ data }) => {
            let result = data;
            if (rewardDesc != null) {
                result = data.filter(function (incentive) {
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
        extraLifeCall.forEach((incentive) => {
            incentiveString += `$${incentive.amount} - ${incentive.description}. `;
        });

        return incentiveString.trim();
    }
};

export = ExtraLifeIncentives;