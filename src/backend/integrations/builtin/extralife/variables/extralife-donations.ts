import { GetDonationsOptions, getParticipantDonations } from 'extra-life-ts';
import { ReplaceVariable } from "../../../../../types/variables";
import integrationManager from "../../../../integrations/integration-manager";

const ExtraLifeDonations: ReplaceVariable = {
    definition: {
        handle: "extraLifeDonations",
        description: "Returns information on extra life donations.",
        examples: [
            {
                usage: 'extraLifeDonations[amount]',
                description: "Returns top donation for currently signed in extra life account."
            },
            {
                usage: 'extraLifeDonations[amount, 1, participantID]',
                description: "Returns top donation for specified participantID."
            },
            {
                usage: 'extraLifeDonations[amount, 3, participantID]',
                description: "Returns top 3 donations for participantID."
            },
            {
                usage: 'extraLifeDonations[createdDateUTC, 5, participantID]',
                description: "Returns 5 most recent donations for participantID."
            },
            {
                usage: 'extraLifeDonations[createdDateUTC, 5, participantID, true]',
                description: "Returns 5 most recent donations for participantID in JSON format."
            },
            {
                usage: 'extraLifeDonations[amount, 3, null, true]',
                description: "Returns top 3 donations for current signed in extra life account in JSON format."
            }
        ],
        categories: ["common", "integrations"],
        possibleDataOutput: ["text"]
    },
    evaluator: (_, sortName: string, numResults: number, participantID: number, returnJson: boolean) => {
        if (numResults == null) {
            numResults = 1;
        }

        if (participantID == null) {
            participantID = integrationManager.getIntegrationAccountId("extralife");
        }

        if (sortName == null || sortName.trim() === '') {
            sortName = 'amount';
        }

        return getParticipantDonations(participantID, { limit: numResults, orderBy: `${sortName} DESC` } as GetDonationsOptions)
            .then(({ data }) => {
                if (returnJson) {
                    return JSON.stringify(data);
                }

                if (data.length === 0) {
                    return "No donations yet!";
                }

                let donationString = "";
                data.forEach((donation) => {
                    donationString += `${donation.displayName} - $${donation.amount}. `;
                });

                return donationString.trim();
            });
    }
};

export = ExtraLifeDonations;