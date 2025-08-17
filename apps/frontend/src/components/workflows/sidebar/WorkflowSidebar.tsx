import { useNodes } from "@xyflow/react";
import { NewActionList } from "./NewActionList";
import { ActionInputs } from "./ActionInputs";

export function WorkflowSidebar() {
  const nodes = useNodes();

  const selectedNodes = nodes.filter((node) => node.selected);

  const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;

  const selectedNodeIsPlaceholder = selectedNode?.type === "placeholder";

  const selectedNodeIsAnAction = selectedNode?.type === "action";

  return (
    <div className="w-100 bg-secondary shrink-0">
      {selectedNodeIsAnAction && <ActionInputs selectedNode={selectedNode} />}
      {selectedNodeIsPlaceholder && <NewActionList />}
    </div>
  );
}
