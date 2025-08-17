import { HttpStatus, Injectable } from "@nestjs/common";
import { CommandConfigsStore } from "data-access/stores/command-configs.store";
import { CommandConfig } from "firebot-types";
import { FirebotException } from "misc/firebot.exception";
import { v4 as uuid } from "uuid";

@Injectable()
export class CommandsService {
  constructor(private readonly commandConfigsStore: CommandConfigsStore) {}

  async getAllCommands() {
    return this.commandConfigsStore.getRoot().commands;
  }

  async getCommand(commandId: string) {
    return this.commandConfigsStore
      .get("commands")
      .find((c) => c.id === commandId);
  }

  async updateCommand(
    commandId: string,
    commandUpdate: Partial<CommandConfig>
  ) {
    const commands = this.commandConfigsStore.get("commands");
    const commandIndex = commands.findIndex((c) => c.id === commandId);

    if (commandIndex === -1) {
      throw new FirebotException(
        `Command with ID ${commandId} not found`,
        HttpStatus.NOT_FOUND
      );
    }

    commands[commandIndex] = {
      ...commands[commandIndex],
      ...commandUpdate,
    };

    this.commandConfigsStore.set("commands", commands);
    return commands[commandIndex];
  }

  async createCommand(command: Omit<CommandConfig, "id">) {
    const commands = this.commandConfigsStore.get("commands");
    commands.push({
      ...command,
      id: uuid(),
    });
    this.commandConfigsStore.set("commands", commands);
    return commands[commands.length - 1];
  }
}
