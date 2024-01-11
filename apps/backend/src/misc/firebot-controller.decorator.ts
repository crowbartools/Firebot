import {
  Controller,
  ControllerOptions,
  UseGuards,
  applyDecorators,
} from "@nestjs/common";
import { FirebotAuthGuard } from "auth/firebot-auth.guard";

type FirebotControllerOptions = ControllerOptions & {
  /**
   * Enable the InternalAuthGuard for all methods in the Controller. Default: true
   */
  auth?: boolean;
};

export function FirebotController({
  auth,
  ...options
}: FirebotControllerOptions): ClassDecorator {
  if (!options.version) {
    options.version = "1";
  }
  const decorators = [Controller(options)];
  if (auth !== false) {
    decorators.push(UseGuards(FirebotAuthGuard));
  }
  return applyDecorators(...decorators);
}
