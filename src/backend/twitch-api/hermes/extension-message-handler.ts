import twitchApi from "../api";
import { ExtensionMessagePubSubNotificationPayload } from "./hermes-types";
import frontendCommunicator from "../../common/frontend-communicator";
import chatCommandHandler from "../../chat/commands/chat-command-handler";
import twitchEventsHandler from "../../events/twitch-events";

export async function handleExtensionMessage(message: ExtensionMessagePubSubNotificationPayload) {
    const extension = await twitchApi.streamerClient.extensions.getReleasedExtension(message.data.sender.extension_client_id);

    const chatHelpers = require("../../chat/chat-helpers");
    const firebotChatMessage = await chatHelpers.buildFirebotChatMessageFromExtensionMessage(
        message.data.content.text,
        message.data.sender.display_name,
        extension.getIconUrl("100x100"),
        message.data.sender.badges,
        message.data.sender.chat_color,
        message.data.id
    );

    frontendCommunicator.send("twitch:chat:message", firebotChatMessage);
    chatCommandHandler.handleChatMessage(firebotChatMessage);
    twitchEventsHandler.chatMessage.triggerChatMessage(firebotChatMessage);
}