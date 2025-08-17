import { Module, OnModuleInit } from "@nestjs/common";
import { ActionTypeExplorer } from "./action-type.explorer";
import { ActionTypeRegistry } from "./action-type.registry";
import { ModuleRef } from "@nestjs/core";
import { WorkflowsController } from "./workflows.controller";
import { SendChatActionType } from "./action-types/send-chat.action";
import { WorkflowEngine } from "./workflow.engine";
import { StreamingPlatformModule } from "streaming-platform/streaming-platform.module";
import { PlaySoundActionType } from "./action-types/play-sound.action";

const actionTypes = [SendChatActionType, PlaySoundActionType];

@Module({
  imports: [StreamingPlatformModule],
  controllers: [WorkflowsController],
  providers: [
    ...actionTypes,
    ActionTypeExplorer,
    ActionTypeRegistry,
    WorkflowEngine,
  ],
  exports: [WorkflowEngine],
})
export class WorkflowsModule implements OnModuleInit {
  constructor(
    private readonly actionTypeExplorer: ActionTypeExplorer,
    private readonly actionTypeRegistry: ActionTypeRegistry,
    private readonly moduleRef: ModuleRef
  ) {}

  onModuleInit() {
    const actionTypes = this.actionTypeExplorer.explore();

    for (const actionType of actionTypes) {
      const instance = this.moduleRef.get(actionType, { strict: false });
      if (!instance) {
        return;
      }
      this.actionTypeRegistry.registerActionType(instance);
    }
  }
}
