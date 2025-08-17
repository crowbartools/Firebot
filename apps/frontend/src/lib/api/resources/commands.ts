import { AxiosInstance } from "axios";
import { CommandConfig } from "firebot-types";

export class CommandsApi {
  constructor(private readonly api: AxiosInstance) {}

  async getAll(): Promise<CommandConfig[]> {
    const response = await this.api.get<CommandConfig[]>("/commands");
    return response.data;
  }

  async get(commandId: string): Promise<CommandConfig> {
    const response = await this.api.get<CommandConfig>(
      `/commands/${commandId}`
    );
    return response.data;
  }

  async update(
    commandId: string,
    commandUpdate: Partial<Omit<CommandConfig, "id">>
  ) {
    const response = await this.api.patch<CommandConfig>(
      `/commands/${commandId}`,
      commandUpdate
    );
    return response.data;
  }

  async create(command: Omit<CommandConfig, "id">) {
    const response = await this.api.post<CommandConfig>("/commands", command);
    return response.data;
  }
}
