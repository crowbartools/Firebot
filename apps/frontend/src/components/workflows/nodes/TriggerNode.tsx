import React from "react";
import { NodeProps } from "@xyflow/react";
import { NextStepWrapperNode } from "./NextStepWrapperNode";
import { BaseNodeHeader, BaseNodeHeaderTitle } from "./BaseNode";
import { cn } from "@/lib/utils";

interface TriggerNodeData {
  label: string;
}

type TriggerNodeProps = {
  data: TriggerNodeData;
} & Partial<NodeProps>;

function TriggerNode(nodeProps: TriggerNodeProps) {
  return (
    <NextStepWrapperNode
      {...nodeProps}
      className={cn(
        "bg-green-50 dark:bg-green-900 border-2 rounded-lg shadow-md p-4 w-62",
        nodeProps.selected
          ? "border-green-500 shadow-lg"
          : "border-green-300 dark:border-green-600",
        "hover:shadow-lg transition-shadow"
      )}
    >
      <BaseNodeHeader>
        <BaseNodeHeaderTitle>{nodeProps.data.label}</BaseNodeHeaderTitle>
      </BaseNodeHeader>
    </NextStepWrapperNode>
  );
}

export default TriggerNode;
