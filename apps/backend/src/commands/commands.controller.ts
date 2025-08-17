import {
  Body,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { FirebotController } from "../misc/firebot-controller.decorator";
import { CommandConfig } from "firebot-types";
import { CommandsService } from "./commands.service";

@FirebotController({
  path: "commands",
})
export class CommandsController {
  constructor(private readonly commandsService: CommandsService) {}

  @Get()
  async getAllCommands() {
    return this.commandsService.getAllCommands();
  }

  @Get(":commandId")
  async getCommand(@Param("commandId") commandId: string) {
    const command = await this.commandsService.getCommand(commandId);
    if (!command) {
      throw new NotFoundException(`Command with id ${commandId} not found`);
    }
    return command;
  }

  @Patch(":commandId")
  async updateCommand(
    @Param("commandId") commandId: string,
    @Body() commandUpdate: Partial<Omit<CommandConfig, "id">>
  ) {
    return this.commandsService.updateCommand(commandId, commandUpdate);
  }

  @Post()
  async createCommand(@Body() command: Omit<CommandConfig, "id">) {
    return this.commandsService.createCommand(command);
  }
}
