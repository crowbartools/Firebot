import { EffectType } from "../../../types/effects";
import { EffectCategory } from "../../../shared/effect-constants";
import twitchApi from "../../twitch-api/api";

const model: EffectType<{
    description: string;
}>  = {
    definition: {
        id: "firebot:create-stream-marker",
        name: "Create Stream Marker",
        description: "Create a stream marker in your Twitch VOD",
        icon: "fad fa-map-pin",
        categories: [ EffectCategory.COMMON, EffectCategory.TWITCH ],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container header="Create Stream Marker">
            <firebot-input input-title="Description" model="effect.description" placeholder-text="Enter description" />
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
    optionsController: () => {
        
    },
    onTriggerEvent: async ({ effect }) => {
        await twitchApi.streams.createStreamMarker(effect.description);
    }
}

module.exports = model;