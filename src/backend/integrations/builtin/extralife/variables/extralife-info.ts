import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import integrationManager from "../../../../integrations/integration-manager";
const { getParticipant } = require('extra-life-ts');

const ExtraLifeInfo: ReplaceVariable = {
    definition: {
        handle: "extraLifeInfo",
        description: "Returns specified data from your extra life profile. See examples for details.",
        examples: [
            {
                usage: 'extraLifeInfo[fundraisingGoal]',
                description: "Returns the fundraising goal for the current logged in extra life account."
            },
            {
                usage: 'extraLifeInfo[fundraisingGoal, participantID]',
                description: "Returns the fundraising goal for the given participantID."
            },
            {
                usage: 'extraLifeInfo[eventName, participantID]',
                description: "Returns the fundraising event name, e.g. Extra Life 2024."
            },
            {
                usage: 'extraLifeInfo[donateLink, participantID]',
                description: "Returns the donation link."
            },
            {
                usage: 'extraLifeInfo[profileLink, participantID]',
                description: "Returns the profile link."
            },
            {
                usage: 'extraLifeInfo[sumDonations, participantID]',
                description: "Returns the sum of current donations."
            },
            {
                usage: 'extraLifeInfo[sumPledges, participantID]',
                description: "Returns the sum of current pledges."
            },
            {
                usage: 'extraLifeInfo[numIncentives, participantID]',
                description: "Returns the number of incentives."
            },
            {
                usage: 'extraLifeInfo[numMilestones, participantID]',
                description: "Returns the number of milestones."
            },
            {
                usage: 'extraLifeInfo[numDonations, participantID]',
                description: "Returns the number of donations."
            },
            {
                usage: 'extraLifeInfo[avatarImageURL, participantID]',
                description: "Returns the url for the extra life avatar image."
            },
            {
                usage: 'extraLifeInfo[null, null, true]',
                description: "Get all profile data for the current logged in extra life account in JSON format."
            }
        ],
        categories: [VariableCategory.COMMON, VariableCategory.INTEGRATION],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, infoPath: string, participantID: number, returnJson: boolean) => {
        if (participantID == null) {
            participantID = integrationManager.getIntegrationAccountId("extralife");
        }

        if (infoPath == null || infoPath.trim() === '') {
            infoPath = 'fundraisingGoal';
        }

        return getParticipant(participantID).then((result) => {
            result = result.data;

            if (returnJson) {
                return JSON.stringify(result);
            }

            if (infoPath === "donateLink") {
                return result.links.donate;
            }

            if (infoPath === "profileLink") {
                return result.links.page;
            }

            return result[infoPath];
        });
    }
};

export = ExtraLifeInfo;