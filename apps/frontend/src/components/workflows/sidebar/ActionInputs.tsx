import { FirebotParameter } from "@/components/parameters/FirebotParameter";
import { Button } from "@/components/ui/button";
import { useActionTypes } from "@/hooks/api/workflows/useActionTypes";
import { Node, useReactFlow } from "@xyflow/react";
import { ArrowLeft } from "lucide-react";
import { useReactFlowUtils } from "../useReactFlowUtils";

type Props = {
  selectedNode: Node;
};

export function ActionInputs({ selectedNode }: Props) {
  const { updateNodeData } = useReactFlow();

  const { data: actionTypes } = useActionTypes();

  const { unselectAll } = useReactFlowUtils();

  const actionType = actionTypes?.find(
    (type) => type.id === selectedNode.data?.actionType
  );

  if (actionType == null) {
    return null;
  }

  return (
    <div>
      <div className="h-10 border-b-2 border-b-border flex px-1">
        <Button variant="ghost" size="icon" onClick={unselectAll}>
          <ArrowLeft />
        </Button>
      </div>
      <div className="mb-2 border-b-1 border-border p-2">
        <h2 className="text-lg font-semibold">{actionType.name}</h2>
        <p>{actionType.description}</p>
      </div>
      <div className="p-2">
        {Object.entries(actionType.parameters || {}).map(
          ([categoryId, category]) => (
            <div key={categoryId} className="mb-4">
              {!!category.title?.length && (
                <h3 className="text-md font-semibold mb-2">{category.title}</h3>
              )}
              {Object.entries(category.parameters).map(([paramId, param]) => (
                <FirebotParameter
                  key={paramId}
                  id={paramId}
                  parameterConfig={param}
                  value={
                    (
                      selectedNode.data?.parameters as Record<string, unknown>
                    )?.[paramId]
                  }
                  onChange={(value) =>
                    updateNodeData(selectedNode.id, (node) => {
                      const newData = { ...node.data };
                      (newData.parameters as Record<string, unknown>)[paramId] =
                        value;
                      return newData;
                    })
                  }
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
