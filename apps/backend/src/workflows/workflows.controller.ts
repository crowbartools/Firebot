import { Body, Get, Param, Post } from "@nestjs/common";
import { FirebotController } from "../misc/firebot-controller.decorator";
import { ActionTypeRegistry } from "./action-type.registry";
import { ActionTriggerType, FirebotActionWorkflow } from "firebot-types";
import { WorkflowEngine } from "./workflow.engine";

@FirebotController({
  path: "workflows",
})
export class WorkflowsController {
  constructor(
    private readonly actionTypeRegistry: ActionTypeRegistry,
    private readonly workflowEngine: WorkflowEngine
  ) {}

  @Get("/action-types")
  getActionTypes() {
    return this.actionTypeRegistry.getActionTypes().map((actionType) => ({
      id: actionType.id,
      name: actionType.name,
      description: actionType.description,
      icon: actionType.icon,
      category: actionType.category,
      parameters: actionType.parameters,
    }));
  }

  @Post("/test/:actionTriggerType")
  async testWorkflow(
    @Param("actionTriggerType") actionTriggerType: ActionTriggerType,
    @Body() workflow: FirebotActionWorkflow
  ) {
    await this.workflowEngine.runWorkflow({
      actionTriggerType,
      isManualTest: true,
      workflow,
    });
  }
}
