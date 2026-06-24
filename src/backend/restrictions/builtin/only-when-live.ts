import type { RestrictionType } from "../../../types";
import twitchStreamInfoManager from "../../streaming-platforms/twitch/stream-info-manager";

const restriction: RestrictionType = {
    definition: {
        id: "firebot:only-when-live",
        name: "Only When Live",
        description: "Limit usage to when you are live."
    },
    optionsTemplate: `
        <div>
            <p>Usage will be restricted to when you are live.</p>
        </div>
    `,
    predicate: () => {
        if (!twitchStreamInfoManager.streamInfo.isLive) {
            return {
                success: false,
                failureReason: "Stream is not live."
            };
        }

        return { success: true };
    }
};

export = restriction;