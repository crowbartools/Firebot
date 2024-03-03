import { Injectable } from "@nestjs/common";
import { Connectable, ConnectionType } from "firebot-types";
import { RealTimeGateway } from "real-time/real-time.gateway";

@Injectable()
export class ConnectionManagerService {
  private connectables: Record<ConnectionType, Connectable[]> = {
    "streaming-platform": [],
    integration: [],
    overlay: [],
  };

  constructor(private readonly realTimeGateway: RealTimeGateway) {}

  registerConnectable(connectable: Connectable, type: ConnectionType) {
    this.connectables[type].push(connectable);
    connectable.on("connected", () => {});
    connectable.on("disconnected", () => {});
  }
}
