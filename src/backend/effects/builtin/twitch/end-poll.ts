import { EffectType } from "../../../../types/effects";
import { EffectCategory } from "../../../../shared/effect-constants";
import logger from "../../../logwrapper";
import twitchApi from "../../../twitch-api/api";

const model: EffectType<{
    archivePoll: boolean;
}> = {
    definition: {
        id: "twitch:end-poll",
        name: "End Twitch Poll",
        description: "Ends the currently active Twitch poll",
        icon: "fad fa-stop-circle",
        categories: [EffectCategory.COMMON, EffectCategory.TWITCH],
        dependencies: {
            twitch: true
        }
    },
    optionsTemplate: `
        <eos-container header="Archive Poll">
            <firebot-checkbox model="effect.archivePoll" label="Archive (hide) poll after closing" />
        </eos-container>

        <eos-container>
            <div class="effect-info alert alert-warning">
                Note: If there is no poll currently running, this will take no action.
            </div>
        </eos-container>
    `,
    optionsValidator: () => [],
    optionsController: () => {},
    onTriggerEvent: async ({ effect }) => {
        const latestPoll = await twitchApi.polls.getMostRecentPoll();

        if (latestPoll?.status !== "ACTIVE") {
            logger.warn("There is no active Twitch poll to end");
            return;
        }

        logger.debug(`Ending Twitch poll "${latestPoll.title}"${effect.archivePoll ? " as archived" : ""}`);
        return await twitchApi.polls.endPoll(latestPoll.id, effect.archivePoll);
    }
};

module.exports = model;
