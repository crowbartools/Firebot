import { ReplaceVariable } from "../../../types/variables";
import { EffectTrigger } from "../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../shared/variable-constants";
const { getParticipantDonations } = require('extra-life-ts');

const ExtraLifeDonations: ReplaceVariable = {
    definition: {
        handle: "extraLifeDonations",
        description: "Returns information on extra life donations.",
        examples: [
            {
                usage: 'extraLifeDonations[participantID, 1, amount]',
                description: "Returns top donation for participantID."
            },
            {
                usage: 'extraLifeDonations[participantID, 3, amount]',
                description: "Returns top 3 donations for participantID."
            },
            {
                usage: 'extraLifeDonations[participantID, 5, createdDateUTC]',
                description: "Returns 5 most recent donations for participantID."
            },
            {
                usage: 'extraLifeDonations[participantID, 3, amount, true]',
                description: "Returns top 3 donations for participantID in JSON format."
            }
        ],
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, participantID: number, numResults: number, sortName: string, returnJson: boolean) => {
        return getParticipantDonations(participantID, { limit: numResults, orderBy: `${sortName} DESC` }).then((result) => {
            result = result.data;

            if (returnJson) {
                return JSON.stringify(result);
            }

            if (result.length === 0) {
                return "No donations yet!";
            }

            let donationString = "";
            result.forEach(donation => {
                donationString += `${donation.displayName} donated $${donation.amount}. `;
            });

            return donationString.trim();
        });
    }
};

export = ExtraLifeDonations;