import { Controller, Get } from "@nestjs/common";

@Controller("example")
export class ExampleController {
  @Get()
  async getHelloWorld() {
    return "Hello world";
  }
}
