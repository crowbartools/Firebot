import React from "react";
import { NodeProps } from "@xyflow/react";
import { NextStepWrapperNode } from "./NextStepWrapperNode";
import {
  BaseNodeContent,
  BaseNodeHeader,
  BaseNodeHeaderTitle,
} from "./BaseNode";
import { cn } from "@/lib/utils";
import { useActionTypes } from "@/hooks/api/workflows/useActionTypes";
import { DynamicIcon } from "lucide-react/dynamic";

interface ActionNodeData {
  label: string;
  actionType?: string;
  icon?: string;
  config?: Record<string, unknown>;
}

type ActionNodeProps = {
  data: ActionNodeData;
} & Partial<NodeProps>;

function ActionNode(nodeProps: ActionNodeProps) {
  const { data: actionTypes } = useActionTypes();

  const actionType = actionTypes?.find(
    (type) => type.id === nodeProps.data?.actionType
  );

  return (
    <NextStepWrapperNode
      {...nodeProps}
      showTopHandle
      className={cn(
        "bg-white dark:bg-secondary border-2 rounded-lg shadow-md p-4 w-62",
        nodeProps.selected
          ? "border-blue-500 shadow-lg"
          : "border-gray-300 dark:border-gray-600",
        "hover:shadow-lg transition-shadow"
      )}
    >
      {actionType != null ? (
        <>
          <BaseNodeHeader>
            <DynamicIcon name={actionType.icon} size={20} />
            <BaseNodeHeaderTitle>{actionType.name}</BaseNodeHeaderTitle>
          </BaseNodeHeader>
        </>
      ) : (
        <BaseNodeContent>
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            Could not find action type: {nodeProps.data.actionType}
          </div>
        </BaseNodeContent>
      )}
      {/* <BaseNodeContent>
        <div className="flex items-center space-x-3">
          {nodeProps.data.icon && (
            <div className="flex-shrink-0">
              <i className={`${nodeProps.data.icon} text-blue-500 text-lg`} />
            </div>
          )}
          <div className="flex-1">
            <div className="font-semibold text-gray-900 dark:text-white text-sm">
              {nodeProps.data.label}
            </div>
            {nodeProps.data.actionType && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {nodeProps.data.actionType}
              </div>
            )}
          </div>
        </div>
      </BaseNodeContent> */}
    </NextStepWrapperNode>
  );
}

export default ActionNode;
