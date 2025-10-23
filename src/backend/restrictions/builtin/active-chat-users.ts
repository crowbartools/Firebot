/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */

import type { RestrictionType } from "../../../types/restrictions";
import { ActiveUserHandler } from "../../chat/active-user-handler";

const model: RestrictionType<never> = {
    definition: {
        id: "firebot:activeChatUsers",
        name: "Active Chat Users",
        description: "Restricts to only active chat users.",
        triggers: []
    },
    optionsTemplate: `
        <div>
            <div>
                <p>Limits to only active chat users (someone who has chatted recently)</p>
            </div>
        </div>
    `,
    predicate: async (triggerData) => {
        return new Promise((resolve, reject) => {
            const username = triggerData.metadata.username;

            if (ActiveUserHandler.userIsActive(username)) {
                resolve(true);
            } else {
                reject("You haven't sent a chat message recently");
            }
        });
    }
};

export = model;