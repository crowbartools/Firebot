import { Get, Req } from "@nestjs/common";
import { FirebotController } from "misc/firebot-controller.decorator";

@FirebotController({
  path: "example",
})
export class ExampleController {
  @Get()
  async getHelloWorld(@Req() request: any) {
    return "Hello world";
  }
}
