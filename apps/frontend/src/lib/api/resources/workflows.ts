import { AxiosInstance } from "axios";
import { FirebotActionType, FirebotActionWorkflow } from "firebot-types";

export class WorkflowsApi {
  constructor(private readonly api: AxiosInstance) {}

  async getActionTypes(): Promise<FirebotActionType[]> {
    const response = await this.api.get<FirebotActionType[]>(
      "/workflows/action-types"
    );
    return response.data;
  }

  async testWorkflow(
    actionTriggerType: string,
    workflow: FirebotActionWorkflow
  ) {
    const response = await this.api.post(
      `/workflows/test/${actionTriggerType}`,
      workflow
    );
    return response.data;
  }
}
