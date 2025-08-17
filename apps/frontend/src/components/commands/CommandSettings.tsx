import { CommandConfigData } from "firebot-types";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";

type Props = {
  configData: Partial<CommandConfigData>;
  onUpdate: (data: Partial<CommandConfigData>) => void;
};

export function CommandsSettings({ configData, onUpdate }: Props) {
  return (
    <div className="p-4">
      <Card>
        <CardContent>
          <Label className="mb-2">Trigger</Label>
          <Input
            placeholder="Enter !trigger or phrase"
            value={configData.trigger}
            onChange={(e) => onUpdate({ trigger: e.target.value })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
