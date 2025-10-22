import { EffectType } from "../../../../types/effects";
import { TwitchApi } from "../api";

const model: EffectType<{
    description: string;
}> = {
    definition: {
        id: "firebot:create-stream-marker",
        name: "Create Stream Marker",
        description: "Create a stream marker in your Twitch VOD",
        icon: "fad fa-map-pin",
        categories: ["common", "twitch"],
        dependencies: {
            twitch: true
        }
    },
    optionsTemplate: `
        <eos-container header="Create Stream Marker">
            <firebot-input input-title="Description" model="effect.description" placeholder-text="Enter description" menu-position="under" />
        </eos-container>

        <eos-container>
            <div class="effect-info alert alert-warning">
                Note: You must be live and VODs must be enabled for this effect to work.
            </div>
        </eos-container>
    `,
    optionsValidator: () => {
        return [] as string[];
    },
    optionsController: () => {},
    onTriggerEvent: async ({ effect }) => {
        await TwitchApi.streams.createStreamMarker(effect.description);
    }
};

module.exports = model;
