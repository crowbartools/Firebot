import type { EffectType } from "../../../../types/effects";
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
        },
        outputs: [
            {
                label: "Stream Marker ID",
                description: "ID of the new stream marker",
                defaultName: "streamMarkerId"
            },
            {
                label: "Stream Marker Position",
                description: "Time (in seconds) of the new stream marker",
                defaultName: "streamMarkerPosition"
            }
        ]
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
        const marker = await TwitchApi.streams.createStreamMarker(effect.description);

        return {
            success: !!marker,
            outputs: marker ? {
                streamMarkerId: marker.id,
                streamMarkerPosition: marker.positionInSeconds
            } : null
        };
    }
};

export = model;