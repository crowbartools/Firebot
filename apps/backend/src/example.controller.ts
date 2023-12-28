import { Controller, Get, Req } from "@nestjs/common";

@Controller("example")
export class ExampleController {
  @Get()
  async getHelloWorld(@Req() request: any) {
    console.log(request.cookies);
    return "Hello world";
  }
}
