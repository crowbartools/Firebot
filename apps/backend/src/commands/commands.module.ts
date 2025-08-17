import { Module } from "@nestjs/common";
import { CommandsController } from "./commands.controller";
import { CommandsService } from "./commands.service";
import { CommandListenerService } from "./command-listener.service";
import { WorkflowsModule } from "workflows/workflows.module";

@Module({
  imports: [WorkflowsModule],
  controllers: [CommandsController],
  providers: [CommandsService, CommandListenerService],
  exports: [],
})
export class CommandsModule {}
