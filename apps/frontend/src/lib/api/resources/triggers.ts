import { AxiosInstance } from "axios";
import { TriggerConfig, TriggerConfigsSettings } from "firebot-types";

export class TriggersApi {
    constructor(private readonly api: AxiosInstance) { }

    async getAll(): Promise<TriggerConfigsSettings> {
        const response = await this.api.get<TriggerConfigsSettings>("/triggers/all");
        return response.data;
    }

    async getActive(): Promise<TriggerConfig[]> {
        const response = await this.api.get<TriggerConfig[]>("/triggers/active");
        return response.data;
    }
}