import { Logger } from "@nestjs/common";
import { ActionType } from "workflows/action-type.decorator";
import {
    ExecuteActionContext,
    FirebotActionIconName,
    FirebotActionType,
    FirebotParameterCategories,
} from "firebot-types";
import { twitchApiClient } from "streaming-platform/platforms/twitch/twitch-api-client";
import { twitchAccountAuthProvider } from "streaming-platform/platforms/twitch/twitch-auth";
import { getStringParam } from "workflows/action-types/action-parameter.utils";

type StreamTitleActionParams = {
    stream: {
        title: string;
    };
};

@ActionType()
export class StreamTitleActionType
    implements FirebotActionType<StreamTitleActionParams> {
    private readonly logger = new Logger("StreamTitleAction");

    id = "stream-title";
    name = "Set Stream Title";
    description = "Update the title of your stream.";
    icon: FirebotActionIconName = "tv-2";
    category = "Twitch";

    parameters: FirebotParameterCategories<StreamTitleActionParams> = {
        stream: {
            parameters: {
                title: {
                    type: "string",
                    title: "Stream Title",
                    placeholder: "My awesome stream!",
                    default: "",
                    validation: { required: true },
                },
            },
        },
    };

    async execute(context: ExecuteActionContext): Promise<void> {
        const title = getStringParam(context.parameters, "title").trim();
        const streamerId = twitchAccountAuthProvider.streamerAccount?.userId;
        const client = twitchApiClient.streamerClient;

        if (!client || !streamerId) {
            this.logger.warn("Stream Title: Twitch client not connected");
            return;
        }
        if (!title) {
            this.logger.warn("Stream Title: no title provided");
            return;
        }

        try {
            await client.channels.updateChannelInfo(streamerId, { title });
            this.logger.debug(`Stream title updated to: ${title}`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            const missingScopeError =
                msg.includes("Missing scope") &&
                (msg.includes("channel:manage:broadcast") || msg.includes("user:edit:broadcast"));

            if (missingScopeError) {
                this.logger.error(
                    "Failed to update stream title due to missing Twitch scope. Re-authenticate your Streamer account so Firebot can request channel:manage:broadcast / user:edit:broadcast."
                );
            }
            this.logger.error(`Failed to update stream title: ${msg}`);
        }
    }
}
