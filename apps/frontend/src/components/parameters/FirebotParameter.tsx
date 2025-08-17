import { FirebotParameter as FirebotParameterType } from "firebot-types";
import { Label } from "../ui/label";
import { parameters } from "./parameter-registry";

type Props = {
  id: string;
  parameterConfig: FirebotParameterType;
  value: unknown;
  onChange: (value: unknown) => void;
};

export function FirebotParameter({
  id,
  parameterConfig,
  value,
  onChange,
}: Props) {
  const ParameterComponent = parameters[parameterConfig.type];
  return (
    <div className="grid w-full max-w-sm items-center gap-3">
      {!!parameterConfig.title?.length && (
        <Label htmlFor={id}>{parameterConfig.title}</Label>
      )}
      {ParameterComponent != null && (
        <ParameterComponent
          id={id}
          config={parameterConfig}
          value={value}
          onChange={onChange}
        />
      )}
    </div>
  );
}
