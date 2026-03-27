import { AxiosInstance } from "axios";
import {
    TriggerConfig,
    TriggerConfigsSettings,
    TriggerGroup,
    TriggerSourceDefinition,
} from "firebot-types";

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

    async getSources(): Promise<TriggerSourceDefinition[]> {
        const response = await this.api.get<TriggerSourceDefinition[]>("/triggers/sources");
        return response.data;
    }

    async getTags(): Promise<string[]> {
        const response = await this.api.get<string[]>("/triggers/tags");
        return response.data;
    }

    async createTag(tag: string): Promise<string[]> {
        const response = await this.api.post<string[]>("/triggers/tags", { tag });
        return response.data;
    }

    async deleteTag(tag: string): Promise<string[]> {
        const response = await this.api.delete<string[]>(
            `/triggers/tags/${encodeURIComponent(tag)}`
        );
        return response.data;
    }

    async createMain(trigger: Omit<TriggerConfig, "id">): Promise<TriggerConfig> {
        const response = await this.api.post<TriggerConfig>("/triggers/main", trigger);
        return response.data;
    }

    async updateMain(
        triggerId: string,
        triggerUpdate: Partial<Omit<TriggerConfig, "id">>
    ): Promise<TriggerConfig | null> {
        const response = await this.api.patch<TriggerConfig | null>(
            `/triggers/main/${triggerId}`,
            triggerUpdate
        );
        return response.data;
    }

    async deleteMain(triggerId: string): Promise<boolean> {
        const response = await this.api.delete<boolean>(`/triggers/main/${triggerId}`);
        return response.data;
    }

    async reorderMain(triggerId: string, targetIndex: number): Promise<TriggerConfig[] | null> {
        const response = await this.api.post<TriggerConfig[] | null>(
            `/triggers/main/${triggerId}/reorder`,
            { targetIndex }
        );
        return response.data;
    }

    async createGroup(name: string): Promise<TriggerGroup> {
        const response = await this.api.post<TriggerGroup>("/triggers/groups", { name });
        return response.data;
    }

    async updateGroup(
        groupId: string,
        groupUpdate: Partial<Pick<TriggerGroup, "name" | "active">>
    ): Promise<TriggerGroup | null> {
        const response = await this.api.patch<TriggerGroup | null>(
            `/triggers/groups/${groupId}`,
            groupUpdate
        );
        return response.data;
    }

    async deleteGroup(groupId: string): Promise<boolean> {
        const response = await this.api.delete<boolean>(`/triggers/groups/${groupId}`);
        return response.data;
    }

    async createGroupTrigger(
        groupId: string,
        trigger: Omit<TriggerConfig, "id">
    ): Promise<TriggerConfig | null> {
        const response = await this.api.post<TriggerConfig | null>(
            `/triggers/groups/${groupId}/triggers`,
            trigger
        );
        return response.data;
    }

    async updateGroupTrigger(
        groupId: string,
        triggerId: string,
        triggerUpdate: Partial<Omit<TriggerConfig, "id">>
    ): Promise<TriggerConfig | null> {
        const response = await this.api.patch<TriggerConfig | null>(
            `/triggers/groups/${groupId}/triggers/${triggerId}`,
            triggerUpdate
        );
        return response.data;
    }

    async deleteGroupTrigger(groupId: string, triggerId: string): Promise<boolean> {
        const response = await this.api.delete<boolean>(
            `/triggers/groups/${groupId}/triggers/${triggerId}`
        );
        return response.data;
    }

    async reorderGroupTrigger(
        groupId: string,
        triggerId: string,
        targetIndex: number
    ): Promise<TriggerConfig[] | null> {
        const response = await this.api.post<TriggerConfig[] | null>(
            `/triggers/groups/${groupId}/triggers/${triggerId}/reorder`,
            { targetIndex }
        );
        return response.data;
    }
}