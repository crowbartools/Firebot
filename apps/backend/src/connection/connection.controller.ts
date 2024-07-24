import { Get, Post } from "@nestjs/common";
import { ConnectionManagerService } from "./connection-manager.service";
import { FirebotController } from "../misc/firebot-controller.decorator";
import { ConnectableRegistryService } from "./connectable-registry.service";

@FirebotController({
  path: "connection",
})
export class ConnectionController {
  constructor(
    private readonly connectionManagerService: ConnectionManagerService,
    private readonly connectablesRegistryService: ConnectableRegistryService
  ) {}

  @Get("/connectables")
  async getConnectables() {
    return this.connectablesRegistryService.getConnectables();
  }

  @Post("/connect/all")
  async connectAll() {
    await this.connectionManagerService.connectAll();
  }

  @Post("/disconnect/all")
  async disconnectAll() {
    await this.connectionManagerService.disconnectAll();
  }
}
