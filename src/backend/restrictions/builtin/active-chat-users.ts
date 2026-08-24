import type { RestrictionType } from "../../../types";
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
    predicate: ({ metadata }) => {
        const username = metadata.username;
        const success = ActiveUserHandler.userIsActive(username);

        return {
            success,
            failureReason: success !== true
                ? "You haven't sent a chat message recently"
                : undefined
        };
    }
};

export = model;