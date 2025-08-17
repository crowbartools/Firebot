import { Injectable } from "@nestjs/common";
import { FirebotActionType } from "firebot-types";

@Injectable()
export class ActionTypeRegistry {
  private readonly registry = new Map<string, FirebotActionType>();

  constructor() {}

  getActionType(id: string): FirebotActionType | undefined {
    return this.registry.get(id);
  }

  getActionTypes(): FirebotActionType[] {
    return Array.from(this.registry.values());
  }

  registerActionType(actionType: FirebotActionType): void {
    this.registry.set(actionType.id, actionType);
  }
}
