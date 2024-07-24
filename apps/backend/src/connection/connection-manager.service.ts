import { Injectable } from "@nestjs/common";
import { ConnectableRegistryService } from "./connectable-registry.service";

@Injectable()
export class ConnectionManagerService {
  constructor(
    private readonly connectableRegistryService: ConnectableRegistryService
  ) {}

  async connectAll() {
    console.log("Connecting all connectables");
    const connectables = this.connectableRegistryService.getConnectables();
    for (const connectable of connectables["streaming-platform"]) {
      if (connectable.canConnect()) {
        console.log(`Connecting ${connectable.name}`);
        await connectable.connect();
      }
    }
    console.log("All connectables connected");
  }

  async disconnectAll() {
    console.log("Disconnecting all connectables");
    const connectables = this.connectableRegistryService.getConnectables();
    for (const connectable of connectables["streaming-platform"]) {
      if (connectable.canConnect()) {
        await connectable.disconnect();
      }
    }
    console.log("All connectables disconnected");
  }
}
