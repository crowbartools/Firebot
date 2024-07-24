import { Injectable } from "@nestjs/common";
import { Connectable, ConnectionType } from "firebot-types";
import { RealTimeGateway } from "../real-time/real-time.gateway";

@Injectable()
export class ConnectableRegistryService {
  private connectables: Record<ConnectionType, Connectable[]> = {
    "streaming-platform": [],
    integration: [],
    overlay: [],
  };

  constructor(private readonly realTimeGateway: RealTimeGateway) {}

  registerConnectable(connectable: Connectable, type: ConnectionType) {
    this.connectables[type].push(connectable);

    connectable.on("connected", () => {
      this.realTimeGateway.broadcast("connection:update", {
        type,
        id: connectable.id,
        name: connectable.name,
        connected: true,
      });
    });

    connectable.on("disconnected", () => {
      this.realTimeGateway.broadcast("connection:update", {
        type,
        id: connectable.id,
        name: connectable.name,
        connected: false,
      });
    });
  }

  getConnectables(): Record<ConnectionType, Connectable[]> {
    return this.connectables;
  }
}
