import "reflect-metadata";
import { ACTION_TYPE_METADATA } from "./action-type.explorer";

export const ActionType = (): ClassDecorator => {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return (target: object) => {
    Reflect.defineMetadata(ACTION_TYPE_METADATA, {}, target);
  };
};
