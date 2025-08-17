import { Injectable } from "@nestjs/common";
import { ActionTypeRegistry } from "./action-type.registry";
import { ActionTriggerType, FirebotActionWorkflow } from "firebot-types";

@Injectable()
export class WorkflowEngine {
  constructor(private readonly actionTypeRegistry: ActionTypeRegistry) {}

  async runWorkflow(context: WorkflowContext): Promise<void> {
    const { workflow } = context;

    const triggerNode = workflow.nodes.find((node) => node.type === "trigger");

    if (!triggerNode) {
      throw new Error("Workflow must have a trigger node.");
    }

    const triggerEdge = workflow.edges.find(
      (edge) => edge.source.nodeId === triggerNode.id
    );

    if (!triggerEdge) {
      throw new Error("Trigger node must have an outgoing edge.");
    }

    // Start execution from the trigger node
    await this.executeNodeRecursively(triggerNode.id, workflow, context);
  }

  private async executeNodeRecursively(
    nodeId: string,
    workflow: FirebotActionWorkflow,
    context: WorkflowContext
  ): Promise<void> {
    const node = workflow.nodes.find((n) => n.id === nodeId);

    if (!node) {
      throw new Error(`Node with id ${nodeId} not found in workflow.`);
    }

    // Skip execution of trigger nodes as they are just starting points
    if (node.type !== "trigger") {
      await this.executeAction(node, context);
    }

    // Find all outgoing edges from this node
    const outgoingEdges = workflow.edges.filter(
      (edge) => edge.source.nodeId === nodeId
    );

    // Execute all connected nodes
    for (const edge of outgoingEdges) {
      await this.executeNodeRecursively(edge.target.nodeId, workflow, context);
    }
  }

  private async executeAction(
    node: Extract<FirebotActionWorkflow["nodes"][0], { type: "action" }>,
    context: WorkflowContext
  ): Promise<void> {
    const actionType = this.actionTypeRegistry.getActionType(node.actionType);

    if (!actionType) {
      throw new Error(`Action type ${node.actionType} not found in registry.`);
    }

    // Extract parameters from the node schema
    const actionInputs = node.schema?.parameters || {};

    try {
      await actionType.execute({
        actionTriggerType: context.actionTriggerType,
        isManualTest: context.isManualTest,
        parameters: actionInputs,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to execute action ${node.actionType} in node ${node.id}: ${errorMessage}`
      );
    }
  }
}

type WorkflowContext = {
  actionTriggerType: ActionTriggerType;
  isManualTest?: boolean;
  workflow: FirebotActionWorkflow;
};
