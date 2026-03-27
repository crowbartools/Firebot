import { Injectable } from "@nestjs/common";
import { TriggersConfigsStore } from "data-access/stores/triggers-configs.store";
import {
    TriggerConfig,
    TriggerConfigsSettings,
    TriggerGroup,
} from "firebot-types";
import { RealTimeGateway } from "real-time/real-time.gateway";
import { v4 as uuid } from "uuid";

@Injectable()
export class TriggersService {
    constructor(
        private readonly triggersConfigsStore: TriggersConfigsStore,
        private readonly realTimeGateway: RealTimeGateway
    ) { }

    getAllTriggerData(): TriggerConfigsSettings {
        return this.triggersConfigsStore.getRoot();
    }

    getAllActiveTriggers(): TriggerConfig[] {
        const { mainTriggers, groups } = this.triggersConfigsStore.getRoot();

        const activeGroupedTriggers = groups
            .filter((group: TriggerGroup) => group.active)
            .flatMap((group: TriggerGroup) => group.triggers);

        return [...mainTriggers, ...activeGroupedTriggers].filter(
            (trigger) => trigger.active
        );
    }

    createMainTrigger(trigger: Omit<TriggerConfig, "id">): TriggerConfig {
        const mainTriggers = this.triggersConfigsStore.get("mainTriggers");
        const created = { ...trigger, id: uuid() };
        mainTriggers.push(created);
        this.triggersConfigsStore.set("mainTriggers", mainTriggers);
        this.broadcastTriggersUpdate();
        return created;
    }

    updateMainTrigger(
        triggerId: string,
        triggerUpdate: Partial<Omit<TriggerConfig, "id">>
    ): TriggerConfig | null {
        const mainTriggers = this.triggersConfigsStore.get("mainTriggers");
        const index = mainTriggers.findIndex(
            (trigger: TriggerConfig) => trigger.id === triggerId
        );
        if (index === -1) {
            return null;
        }

        mainTriggers[index] = {
            ...mainTriggers[index],
            ...triggerUpdate,
            id: mainTriggers[index].id,
        };

        this.triggersConfigsStore.set("mainTriggers", mainTriggers);
        this.broadcastTriggersUpdate();
        return mainTriggers[index];
    }

    deleteMainTrigger(triggerId: string): boolean {
        const mainTriggers = this.triggersConfigsStore.get("mainTriggers");
        const nextMainTriggers = mainTriggers.filter(
            (trigger: TriggerConfig) => trigger.id !== triggerId
        );
        if (nextMainTriggers.length === mainTriggers.length) {
            return false;
        }

        this.triggersConfigsStore.set("mainTriggers", nextMainTriggers);
        this.broadcastTriggersUpdate();
        return true;
    }

    createGroup(name: string): TriggerGroup {
        const groups = this.triggersConfigsStore.get("groups");
        const created: TriggerGroup = {
            id: uuid(),
            name,
            active: true,
            triggers: [],
        };
        groups.push(created);
        this.triggersConfigsStore.set("groups", groups);
        this.broadcastTriggersUpdate();
        return created;
    }

    updateGroup(
        groupId: string,
        groupUpdate: Partial<Pick<TriggerGroup, "name" | "active">>
    ): TriggerGroup | null {
        const groups = this.triggersConfigsStore.get("groups");
        const index = groups.findIndex((group: TriggerGroup) => group.id === groupId);
        if (index === -1) {
            return null;
        }

        groups[index] = {
            ...groups[index],
            ...groupUpdate,
            id: groups[index].id,
            triggers: groups[index].triggers,
        };

        this.triggersConfigsStore.set("groups", groups);
        this.broadcastTriggersUpdate();
        return groups[index];
    }

    deleteGroup(groupId: string): boolean {
        const groups = this.triggersConfigsStore.get("groups");
        const nextGroups = groups.filter((group: TriggerGroup) => group.id !== groupId);

        if (nextGroups.length === groups.length) {
            return false;
        }

        this.triggersConfigsStore.set("groups", nextGroups);
        this.broadcastTriggersUpdate();
        return true;
    }

    createGroupTrigger(
        groupId: string,
        trigger: Omit<TriggerConfig, "id">
    ): TriggerConfig | null {
        const groups = this.triggersConfigsStore.get("groups");
        const group = groups.find(
            (candidateGroup: TriggerGroup) => candidateGroup.id === groupId
        );

        if (!group) {
            return null;
        }

        const created = {
            ...trigger,
            id: uuid(),
        };
        group.triggers.push(created);

        this.triggersConfigsStore.set("groups", groups);
        this.broadcastTriggersUpdate();

        return created;
    }

    updateGroupTrigger(
        groupId: string,
        triggerId: string,
        triggerUpdate: Partial<Omit<TriggerConfig, "id">>
    ): TriggerConfig | null {
        const groups = this.triggersConfigsStore.get("groups");
        const group = groups.find(
            (candidateGroup: TriggerGroup) => candidateGroup.id === groupId
        );

        if (!group) {
            return null;
        }

        const triggerIndex = group.triggers.findIndex(
            (trigger: TriggerConfig) => trigger.id === triggerId
        );
        if (triggerIndex === -1) {
            return null;
        }

        group.triggers[triggerIndex] = {
            ...group.triggers[triggerIndex],
            ...triggerUpdate,
            id: group.triggers[triggerIndex].id,
        };

        this.triggersConfigsStore.set("groups", groups);
        this.broadcastTriggersUpdate();

        return group.triggers[triggerIndex];
    }

    deleteGroupTrigger(groupId: string, triggerId: string): boolean {
        const groups = this.triggersConfigsStore.get("groups");
        const group = groups.find(
            (candidateGroup: TriggerGroup) => candidateGroup.id === groupId
        );

        if (!group) {
            return false;
        }

        const nextTriggers = group.triggers.filter(
            (trigger: TriggerConfig) => trigger.id !== triggerId
        );
        if (nextTriggers.length === group.triggers.length) {
            return false;
        }

        group.triggers = nextTriggers;

        this.triggersConfigsStore.set("groups", groups);
        this.broadcastTriggersUpdate();

        return true;
    }

    private broadcastTriggersUpdate() {
        this.realTimeGateway.broadcast("triggers:update", {
            updatedAt: Date.now(),
        });
    }
}