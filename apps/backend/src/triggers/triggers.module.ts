import { Module } from "@nestjs/common";
import { TriggersController } from "./triggers.controller";
import { TriggersService } from "./triggers.service";
import { TriggerListenerService } from "./trigger-listener.service";
import { WorkflowsModule } from "workflows/workflows.module";

@Module({
    imports: [WorkflowsModule],
    controllers: [TriggersController],
    providers: [TriggersService, TriggerListenerService],
})
export class TriggersModule { }