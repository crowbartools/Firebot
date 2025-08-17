import { FirebotParameter } from "firebot-types";
import { FirebotParameterProps } from "./firebot-parameter-props";
import { FirebotStringParameter } from "./components/firebot-string-parameter";

export const parameters: Partial<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Record<FirebotParameter["type"], React.FC<FirebotParameterProps<any, any>>>
> = {
  string: FirebotStringParameter,
};
