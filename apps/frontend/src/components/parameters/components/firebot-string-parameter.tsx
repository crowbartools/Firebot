import { Input } from "@/components/ui/input";
import { FirebotParameterProps } from "../firebot-parameter-props";
import { StringParameter } from "firebot-types";

export function FirebotStringParameter({
  config,
  value,
  onChange,
}: FirebotParameterProps<StringParameter, string>) {
  return (
    <Input
      type={"text"}
      placeholder={config.placeholder}
      value={value ?? config.default}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
