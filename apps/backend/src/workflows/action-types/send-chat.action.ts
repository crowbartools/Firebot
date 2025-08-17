import { ActionType } from "workflows/action-type.decorator";
import {
  ExecuteActionContext,
  FirebotActionIconName,
  FirebotActionType,
  FirebotParameterCategories,
} from "firebot-types";
import { PlatformManagerService } from "streaming-platform/platform-manager.service";

type SendChatActionParams = {
  chatMessage: {
    content: string;
  };
};

@ActionType()
export class SendChatActionType
  implements FirebotActionType<SendChatActionParams>
{
  constructor(
    private readonly platformManagerService: PlatformManagerService
  ) {}

  id = "send-chat";
  name = "Send Chat Message";
  description = "Send a message to your chat.";
  icon: FirebotActionIconName = "message-square";
  category = "Chat";

  parameters: FirebotParameterCategories<SendChatActionParams> = {
    chatMessage: {
      parameters: {
        content: {
          type: "string",
          title: "Chat Message",
          description: "The content of the chat message to send.",
          default: "",
        },
      },
    },
  };

  async execute(context: ExecuteActionContext): Promise<void> {
    const platforms = this.platformManagerService.getPlatforms();

    for (const platform of platforms) {
      if (platform.connected && platform.chat) {
        await platform.chat.sendMessage(context.parameters.content as string);
      }
    }
  }
}
