import { AxiosInstance } from "axios";
import { EventConfig, EventConfigsSettings } from "firebot-types";

export class EventsApi {
    constructor(private readonly api: AxiosInstance) { }

    async getAll(): Promise<EventConfigsSettings> {
        const response = await this.api.get<EventConfigsSettings>("/events/all");
        return response.data;
    }

    async getActive(): Promise<EventConfig[]> {
        const response = await this.api.get<EventConfig[]>("/events/active");
        return response.data;
    }
}
