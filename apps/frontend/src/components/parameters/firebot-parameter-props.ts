import { FirebotParameter } from "firebot-types";

export type FirebotParameterProps<
  Config extends FirebotParameter = FirebotParameter,
  Value = unknown,
> = {
  id: string;
  config: Config;
  value?: Value;
  onChange: (value?: Value | null) => void;
};
