import { Injectable, Type } from "@nestjs/common";
import { ModulesContainer } from "@nestjs/core/injector/modules-container";
import { FirebotActionType } from "firebot-types";

export const ACTION_TYPE_METADATA = "__fbActionType__";

/**
 * This service looks through the modules in the application and finds all
 * classes that are decorated with the `@ActionType()` decorator.
 */

@Injectable()
export class ActionTypeExplorer {
  constructor(private readonly modulesContainer: ModulesContainer) {}

  explore(): Type<FirebotActionType>[] {
    const allModules = [...this.modulesContainer.values()];

    const allProviders = allModules.flatMap((module) => [
      ...module.providers.values(),
    ]);

    const actionTypes = allProviders.map(({ instance }) => {
      if (!instance) {
        return undefined;
      }
      return this.extractMetadata(instance, ACTION_TYPE_METADATA);
    });

    return actionTypes.filter(
      (provider): provider is Type<FirebotActionType> => !!provider
    );
  }

  private extractMetadata(
    // eslint-disable-next-line @typescript-eslint/ban-types
    instance: Object,
    metadataKey: string
  ): Type<FirebotActionType> | undefined {
    if (!instance.constructor) {
      return;
    }
    const metadata = Reflect.getMetadata(metadataKey, instance.constructor);
    return metadata
      ? (instance.constructor as Type<FirebotActionType>)
      : undefined;
  }
}
