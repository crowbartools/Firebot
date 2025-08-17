import { useActionTypes } from "@/hooks/api/workflows/useActionTypes";
import { useReactFlowUtils } from "../useReactFlowUtils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { FirebotActionType } from "firebot-types";
import { Card } from "@/components/ui/card";
import { DynamicIcon } from "lucide-react/dynamic";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function NewActionList() {
  const { data: actionTypes } = useActionTypes();

  const { unselectAll, replacePlaceholderWithActionNode } = useReactFlowUtils();

  return (
    <div>
      <div className="h-10 border-b-2 border-b-border flex px-1">
        <Button variant="ghost" size="icon" onClick={unselectAll}>
          <ArrowLeft />
        </Button>
      </div>
      <div className="p-2">
        <h5 className="text-sm">Next Step</h5>
        <div className="text-xs text-muted-foreground mb-2">
          Set the next action in the workflow
        </div>
        <Input placeholder="Search actions..." className="mb-2" />
        {actionTypes?.map((actionType) => (
          <ActionTypeCard
            key={actionType.id}
            actionType={actionType}
            onPress={() => {
              replacePlaceholderWithActionNode({ actionType: actionType.id });
            }}
          />
        ))}
      </div>
    </div>
  );
}

type ActionTypeCardProps = {
  actionType: FirebotActionType;
  onPress: () => void;
};
function ActionTypeCard({ actionType, onPress }: ActionTypeCardProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card
          key={actionType.id}
          className="p-3 hover:bg-secondary cursor-pointer"
          onClick={onPress}
        >
          <div className="flex items-center">
            <div className="w-8 flex items-center justify-center">
              <DynamicIcon name={actionType.icon} size={20} color={"white"} />
            </div>
            <div className="grow text-sm">{actionType.name}</div>
          </div>
        </Card>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>{actionType.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
