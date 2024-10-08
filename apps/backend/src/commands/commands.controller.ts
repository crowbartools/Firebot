import { Body, Get, NotFoundException, Param, Patch } from "@nestjs/common";
import { FirebotController } from "../misc/firebot-controller.decorator";
import { CommandConfigsStore } from "../data-access/stores/command-configs.store";
import { CommandConfig } from "firebot-types";

@FirebotController({
  path: "command",
})
export class CommandController {
  constructor(private readonly commandConfigsStore: CommandConfigsStore) {}

  @Get()
  async getAllCommands() {
    return this.commandConfigsStore.getRoot().commands;
  }

  @Get(":commandId")
  async getCommand(@Param("commandId") commandId: string) {
    const commandIndex = this.getCommandIndexById(commandId);
    return this.commandConfigsStore.get("commands")[commandIndex];
  }

  @Patch(":commandId")
  async saveCommand(
    @Param("commandId") commandId: string,
    @Body() commandUpdate: Partial<CommandConfig>
  ) {
    const commands = this.commandConfigsStore.get("commands");
    const commandIndex = this.getCommandIndexById(commandId);

    commands[commandIndex] = {
      ...commands[commandIndex],
      ...commandUpdate,
    };

    this.commandConfigsStore.set("commands", commands);
    return commands[commandIndex];
  }

  private getCommandIndexById(commandId: string) {
    const index = this.commandConfigsStore
      .get("commands")
      .findIndex((c) => c.id === commandId);

    if (index === -1) {
      throw new NotFoundException("Command not found");
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return index!;
  }
}
