import { Module } from "@nestjs/common";
import { TriggersController } from "./triggers.controller";
import { TriggersService } from "./triggers.service";

@Module({
    controllers: [TriggersController],
    providers: [TriggersService],
})
export class TriggersModule { }