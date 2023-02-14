import { Module } from "@nestjs/common";
import { ExampleController } from "./example.controller";

@Module({
  imports: [],
  controllers: [ExampleController],
  providers: [],
})
export class AppModule {}
