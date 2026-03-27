import { Injectable } from "@nestjs/common";
import { EventsConfigsStore } from "data-access/stores/events-configs.store";
import { EventConfig, EventConfigsSettings, EventGroup } from "firebot-types";
import { v4 as uuid } from "uuid";
import { RealTimeGateway } from "real-time/real-time.gateway";

@Injectable()
export class EventsService {
    constructor(
        private readonly eventsConfigsStore: EventsConfigsStore,
        private readonly realTimeGateway: RealTimeGateway
    ) { }

    getAllEventData(): EventConfigsSettings {
        return this.eventsConfigsStore.getRoot();
    }

    getAllActiveEvents(): EventConfig[] {
        const { mainEvents, groups } = this.eventsConfigsStore.getRoot();

        const activeGroupEvents = groups
            .filter((group: EventGroup) => group.active)
            .flatMap((group: EventGroup) => group.events);

        return [...mainEvents, ...activeGroupEvents].filter((event) => event.active);
    }

    createMainEvent(event: Omit<EventConfig, "id">): EventConfig {
        const mainEvents = this.eventsConfigsStore.get("mainEvents");
        const created = { ...event, id: uuid() };
        mainEvents.push(created);
        this.eventsConfigsStore.set("mainEvents", mainEvents);
        this.broadcastEventsUpdate();
        return created;
    }

    updateMainEvent(
        eventId: string,
        eventUpdate: Partial<Omit<EventConfig, "id">>
    ): EventConfig | null {
        const mainEvents = this.eventsConfigsStore.get("mainEvents");
        const index = mainEvents.findIndex((event: EventConfig) => event.id === eventId);
        if (index === -1) {
            return null;
        }

        mainEvents[index] = {
            ...mainEvents[index],
            ...eventUpdate,
            id: mainEvents[index].id,
        };

        this.eventsConfigsStore.set("mainEvents", mainEvents);
        this.broadcastEventsUpdate();
        return mainEvents[index];
    }

    deleteMainEvent(eventId: string): boolean {
        const mainEvents = this.eventsConfigsStore.get("mainEvents");
        const nextMainEvents = mainEvents.filter((event: EventConfig) => event.id !== eventId);
        if (nextMainEvents.length === mainEvents.length) {
            return false;
        }

        this.eventsConfigsStore.set("mainEvents", nextMainEvents);
        this.broadcastEventsUpdate();
        return true;
    }

    createGroup(name: string): EventGroup {
        const groups = this.eventsConfigsStore.get("groups");
        const created: EventGroup = {
            id: uuid(),
            name,
            active: true,
            events: [],
        };
        groups.push(created);
        this.eventsConfigsStore.set("groups", groups);
        this.broadcastEventsUpdate();
        return created;
    }

    updateGroup(
        groupId: string,
        groupUpdate: Partial<Pick<EventGroup, "name" | "active">>
    ): EventGroup | null {
        const groups = this.eventsConfigsStore.get("groups");
        const index = groups.findIndex((group: EventGroup) => group.id === groupId);
        if (index === -1) {
            return null;
        }

        groups[index] = {
            ...groups[index],
            ...groupUpdate,
            id: groups[index].id,
            events: groups[index].events,
        };

        this.eventsConfigsStore.set("groups", groups);
        this.broadcastEventsUpdate();
        return groups[index];
    }

    deleteGroup(groupId: string): boolean {
        const groups = this.eventsConfigsStore.get("groups");
        const nextGroups = groups.filter((group: EventGroup) => group.id !== groupId);

        if (nextGroups.length === groups.length) {
            return false;
        }

        this.eventsConfigsStore.set("groups", nextGroups);
        this.broadcastEventsUpdate();
        return true;
    }

    createGroupEvent(
        groupId: string,
        event: Omit<EventConfig, "id">
    ): EventConfig | null {
        const groups = this.eventsConfigsStore.get("groups");
        const group = groups.find((candidateGroup: EventGroup) => candidateGroup.id === groupId);

        if (!group) {
            return null;
        }

        const created = {
            ...event,
            id: uuid(),
        };
        group.events.push(created);

        this.eventsConfigsStore.set("groups", groups);
        this.broadcastEventsUpdate();

        return created;
    }

    updateGroupEvent(
        groupId: string,
        eventId: string,
        eventUpdate: Partial<Omit<EventConfig, "id">>
    ): EventConfig | null {
        const groups = this.eventsConfigsStore.get("groups");
        const group = groups.find((candidateGroup: EventGroup) => candidateGroup.id === groupId);

        if (!group) {
            return null;
        }

        const eventIndex = group.events.findIndex((event: EventConfig) => event.id === eventId);
        if (eventIndex === -1) {
            return null;
        }

        group.events[eventIndex] = {
            ...group.events[eventIndex],
            ...eventUpdate,
            id: group.events[eventIndex].id,
        };

        this.eventsConfigsStore.set("groups", groups);
        this.broadcastEventsUpdate();

        return group.events[eventIndex];
    }

    deleteGroupEvent(groupId: string, eventId: string): boolean {
        const groups = this.eventsConfigsStore.get("groups");
        const group = groups.find((candidateGroup: EventGroup) => candidateGroup.id === groupId);

        if (!group) {
            return false;
        }

        const nextEvents = group.events.filter((event: EventConfig) => event.id !== eventId);
        if (nextEvents.length === group.events.length) {
            return false;
        }

        group.events = nextEvents;

        this.eventsConfigsStore.set("groups", groups);
        this.broadcastEventsUpdate();

        return true;
    }

    private broadcastEventsUpdate() {
        this.realTimeGateway.broadcast("events:update", {
            updatedAt: Date.now(),
        });
    }
}
