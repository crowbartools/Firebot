import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { ChatItem, StreamingPlatform } from "firebot-types";
import { CommandsService } from "./commands.service";
import { WorkflowEngine } from "workflows/workflow.engine";

@Injectable()
export class CommandListenerService {
  constructor(
    private readonly commandsService: CommandsService,
    private readonly workflowEngine: WorkflowEngine
  ) {}

  @OnEvent("platform.chatItem")
  async handleChatItem(payload: {
    platform: StreamingPlatform;
    data: ChatItem;
  }) {
    if (payload.data.type === "message") {
      const commands = await this.commandsService.getAllCommands();
      for (const command of commands) {
        if (
          command.data?.trigger &&
          payload.data.chatMessage.rawText.startsWith(command.data.trigger)
        ) {
          await this.workflowEngine.runWorkflow({
            actionTriggerType: "command",
            workflow: command.actionWorkflow,
          });
        }
      }
    }
  }
}
