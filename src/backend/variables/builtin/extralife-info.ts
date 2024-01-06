import { ReplaceVariable } from "../../../types/variables";
import { EffectTrigger } from "../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../shared/variable-constants";
const { getParticipant } = require('extra-life-ts');

const ExtraLifeInfo: ReplaceVariable = {
    definition: {
        handle: "extraLifeInfo",
        description: "Returns specified data from your extra life profile. See examples for details.",
        examples: [
            {
                usage: 'extraLifeInfo[participantID, fundraisingGoal]',
                description: "Returns the fundraising goal."
            },
            {
                usage: 'extraLifeInfo[participantID, eventName]',
                description: "Returns the fundraising event name, e.g. Extra Life 2024."
            },
            {
                usage: 'extraLifeInfo[participantID, donateLink]',
                description: "Returns the donation link."
            },
            {
                usage: 'extraLifeInfo[participantID, profileLink]',
                description: "Returns the profile link."
            },
            {
                usage: 'extraLifeInfo[participantID, sumDonations]',
                description: "Returns the sum of current donations."
            },
            {
                usage: 'extraLifeInfo[participantID, sumPledges]',
                description: "Returns the sum of current pledges."
            },
            {
                usage: 'extraLifeInfo[participantID, numIncentives]',
                description: "Returns the number of incentives."
            },
            {
                usage: 'extraLifeInfo[participantID, numMilestones]',
                description: "Returns the number of milestones."
            },
            {
                usage: 'extraLifeInfo[participantID, numDonations]',
                description: "Returns the number of donations."
            },
            {
                usage: 'extraLifeInfo[participantID, avatarImageURL]',
                description: "Returns the url for the extra life avatar image."
            }
        ],
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, participantID: number, infoPath: string) => {
        return getParticipant(participantID).then((result) => {
            result = result.data;
            if (result) {

                if (infoPath === "donateLink") {
                    return result.links.donate;
                }

                if (infoPath === "profileLink") {
                    return result.links.page;
                }

                return result[infoPath];
            }

            return "[Error]";
        });
    }
};

export = ExtraLifeInfo;