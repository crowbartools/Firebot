import { AxiosInstance } from "axios";
import { Connectable, ConnectionType } from "firebot-types";
export class ConnectionApi {
  constructor(private readonly api: AxiosInstance) {}

  async useToggleAllConnections(shouldConnect: boolean): Promise<void> {
    await this.api.post(
      shouldConnect ? "/connection/connect/all" : "/connection/disconnect/all"
    );
  }

  async connectAll(): Promise<void> {
    await this.api.post("/connection/connect/all");
  }

  async disconnectAll(): Promise<void> {
    await this.api.post("/connection/disconnect/all");
  }

  async getConnectables(): Promise<Record<ConnectionType, Connectable[]>> {
    const response = this.api.get<Record<ConnectionType, Connectable[]>>(
      "/connection/connectables"
    );
    return (await response).data;
  }
}
