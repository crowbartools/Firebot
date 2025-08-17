import { useMutation } from "@tanstack/react-query";
import { useFbApi } from "../use-fb-api";
import { ActionTriggerType, FirebotActionWorkflow } from "firebot-types";

export function useTestWorkflow() {
  const { api } = useFbApi();
  return useMutation({
    mutationFn: (params: {
      actionTriggerType: ActionTriggerType;
      workflow: FirebotActionWorkflow;
    }) => {
      return api.workflows.testWorkflow(
        params.actionTriggerType,
        params.workflow
      );
    },
  });
}
