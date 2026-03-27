import { Injectable } from "@nestjs/common";
import { TriggersConfigsStore } from "data-access/stores/triggers-configs.store";
import {
    TriggerConfig,
    TriggerConfigsSettings,
    TriggerGroup,
    TriggerSourceDefinition,
} from "firebot-types";
import { RealTimeGateway } from "real-time/real-time.gateway";
import { TRIGGER_SOURCE_DEFINITIONS } from "./trigger-source-definitions";
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

    getTriggerSourceDefinitions(): TriggerSourceDefinition[] {
        return TRIGGER_SOURCE_DEFINITIONS;
    }

    getAllTags(): string[] {
        const settings = this.triggersConfigsStore.getRoot();
        const tags = new Set(settings.sortTags ?? []);

        settings.mainTriggers.forEach((trigger) => {
            (trigger.tags ?? []).forEach((tag) => tags.add(tag));
        });

        settings.groups.forEach((group) => {
            group.triggers.forEach((trigger) => {
                (trigger.tags ?? []).forEach((tag) => tags.add(tag));
            });
        });

        return Array.from(tags).sort((a, b) => a.localeCompare(b));
    }

    createTag(tag: string): string[] {
        const normalizedTag = tag.trim();
        if (!normalizedTag.length) {
            return this.getAllTags();
        }

        const sortTags = this.triggersConfigsStore.get("sortTags");
        if (!sortTags.includes(normalizedTag)) {
            sortTags.push(normalizedTag);
            this.triggersConfigsStore.set("sortTags", sortTags);
            this.broadcastTriggersUpdate();
        }

        return this.getAllTags();
    }

    deleteTag(tag: string): string[] {
        const normalizedTag = tag.trim();
        if (!normalizedTag.length) {
            return this.getAllTags();
        }

        const sortTags = this.triggersConfigsStore
            .get("sortTags")
            .filter((candidateTag) => candidateTag !== normalizedTag);
        this.triggersConfigsStore.set("sortTags", sortTags);

        const mainTriggers = this.triggersConfigsStore.get("mainTriggers");
        const groups = this.triggersConfigsStore.get("groups");

        const nextMainTriggers = mainTriggers.map((trigger) => ({
            ...trigger,
            tags: (trigger.tags ?? []).filter((candidateTag) => candidateTag !== normalizedTag),
        }));

        const nextGroups = groups.map((group) => ({
            ...group,
            triggers: group.triggers.map((trigger) => ({
                ...trigger,
                tags: (trigger.tags ?? []).filter(
                    (candidateTag) => candidateTag !== normalizedTag
                ),
            })),
        }));

        this.triggersConfigsStore.set("mainTriggers", nextMainTriggers);
        this.triggersConfigsStore.set("groups", nextGroups);
        this.broadcastTriggersUpdate();

        return this.getAllTags();
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

    reorderMainTrigger(triggerId: string, targetIndex: number): TriggerConfig[] | null {
        const mainTriggers = this.triggersConfigsStore.get("mainTriggers");
        const currentIndex = mainTriggers.findIndex(
            (trigger: TriggerConfig) => trigger.id === triggerId
        );

        if (currentIndex === -1) {
            return null;
        }

        const boundedTargetIndex = Math.max(
            0,
            Math.min(targetIndex, mainTriggers.length - 1)
        );

        const [movedTrigger] = mainTriggers.splice(currentIndex, 1);
        mainTriggers.splice(boundedTargetIndex, 0, movedTrigger);

        this.triggersConfigsStore.set("mainTriggers", mainTriggers);
        this.broadcastTriggersUpdate();

        return mainTriggers;
    }

    reorderGroupTrigger(
        groupId: string,
        triggerId: string,
        targetIndex: number
    ): TriggerConfig[] | null {
        const groups = this.triggersConfigsStore.get("groups");
        const group = groups.find(
            (candidateGroup: TriggerGroup) => candidateGroup.id === groupId
        );

        if (!group) {
            return null;
        }

        const currentIndex = group.triggers.findIndex(
            (trigger: TriggerConfig) => trigger.id === triggerId
        );

        if (currentIndex === -1) {
            return null;
        }

        const boundedTargetIndex = Math.max(
            0,
            Math.min(targetIndex, group.triggers.length - 1)
        );

        const [movedTrigger] = group.triggers.splice(currentIndex, 1);
        group.triggers.splice(boundedTargetIndex, 0, movedTrigger);

        this.triggersConfigsStore.set("groups", groups);
        this.broadcastTriggersUpdate();

        return group.triggers;
    }

    private broadcastTriggersUpdate() {
        this.realTimeGateway.broadcast("triggers:update", {
            updatedAt: Date.now(),
        });
    }
}