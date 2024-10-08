import { Module } from "@nestjs/common";
import { CommandController } from "./commands.controller";

@Module({
  imports: [],
  controllers: [CommandController],
  providers: [],
  exports: [],
})
export class CommandsModule {}
