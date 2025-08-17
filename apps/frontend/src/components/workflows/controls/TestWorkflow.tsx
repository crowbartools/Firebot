import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent } from "@/components/ui/tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { CirclePlay } from "lucide-react";
import { useActionWorkflowEditor } from "../ActionWorkflowEditorContext";
import { useTestWorkflow } from "@/hooks/api/workflows/useTestWorkflow";

export function TestWorkflow() {
  const { workflow } = useActionWorkflowEditor();

  const { mutate: testWorkflow } = useTestWorkflow();

  const handleTestWorkflow = () => {
    testWorkflow({
      actionTriggerType: "command",
      workflow,
    });
  };

  return (
    <Tooltip>
      <TooltipTrigger>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleTestWorkflow}
        >
          <CirclePlay />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Test Workflow</p>
      </TooltipContent>
    </Tooltip>
  );
}
