/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */

import type { RestrictionType } from "../../../types/restrictions";
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
    predicate: async () => {
        return new Promise((resolve, reject) => {
            if (!twitchStreamInfoManager.streamInfo.isLive) {
                return reject("Stream is not live.");
            }

            return resolve(true);
        });
    }
};

export = restriction;